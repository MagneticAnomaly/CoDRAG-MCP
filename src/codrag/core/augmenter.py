"""
Trace Augmenter for CoDRAG.

LLM-based augmentation of trace nodes with summaries, roles, and confidence scores.
Implements the Phase 1 pipeline (Steps 2-3) from LLM_TRACE_AUGMENTATION_RESEARCH.md.

Key design constraints:
- Each LLM call is self-contained (~2-4k tokens), never whole-repo context.
- Augmentation is stored as an overlay (trace_augmented.jsonl), never modifies trace_nodes.
- Confidence scores (0.0-1.0) on every generated attribute.
- Incremental: only re-augments nodes whose source file hash changed.
"""
from __future__ import annotations

import json
import logging
import os
import tempfile
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

AUGMENT_FORMAT_VERSION = "1.0"

# Symbol roles the fast model can assign
VALID_ROLES = frozenset({
    "entry_point", "handler", "utility", "model", "config",
    "test", "internal", "script", "api", "core", "ui",
})


@dataclass
class AugmentationEntry:
    """Single augmentation overlay for a trace node."""
    node_id: str
    summary: str
    role: str
    confidence: float
    augmented_at: str
    model: str
    version: int = 1
    validated: bool = False
    validated_at: Optional[str] = None
    validated_by: Optional[str] = None
    file_hash: Optional[str] = None  # hash of source when augmented, for staleness

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "node_id": self.node_id,
            "summary": self.summary,
            "role": self.role,
            "confidence": round(self.confidence, 3),
            "augmented_at": self.augmented_at,
            "model": self.model,
            "version": self.version,
            "validated": self.validated,
        }
        if self.validated_at:
            d["validated_at"] = self.validated_at
        if self.validated_by:
            d["validated_by"] = self.validated_by
        if self.file_hash:
            d["file_hash"] = self.file_hash
        return d

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "AugmentationEntry":
        return cls(
            node_id=d["node_id"],
            summary=d.get("summary", ""),
            role=d.get("role", "internal"),
            confidence=float(d.get("confidence", 0.0)),
            augmented_at=d.get("augmented_at", ""),
            model=d.get("model", "unknown"),
            version=int(d.get("version", 1)),
            validated=bool(d.get("validated", False)),
            validated_at=d.get("validated_at"),
            validated_by=d.get("validated_by"),
            file_hash=d.get("file_hash"),
        )


@dataclass
class AugmentResult:
    """Result of an augmentation run."""
    total_nodes: int = 0
    augmented: int = 0
    skipped: int = 0
    failed: int = 0
    tokens_used: int = 0
    duration_ms: float = 0.0
    errors: List[str] = field(default_factory=list)


class LLMClient:
    """
    Minimal LLM client for augmentation calls.
    Wraps Ollama-compatible /api/generate endpoint.
    """

    def __init__(self, endpoint_url: str, model: str, timeout: float = 30.0):
        self.endpoint_url = endpoint_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    def generate(self, prompt: str, system: Optional[str] = None) -> Tuple[str, int]:
        """
        Call the LLM and return (response_text, tokens_used).
        Raises on network/parse errors.
        """
        import requests

        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.1, "num_predict": 512},
        }
        if system:
            payload["system"] = system

        url = f"{self.endpoint_url}/api/generate"
        resp = requests.post(url, json=payload, timeout=self.timeout)
        resp.raise_for_status()
        data = resp.json()
        text = data.get("response", "")
        tokens = data.get("eval_count", 0) + data.get("prompt_eval_count", 0)
        return text, tokens

    def is_available(self) -> bool:
        """Check if the endpoint is reachable."""
        import requests
        try:
            resp = requests.get(f"{self.endpoint_url}/api/tags", timeout=5)
            return resp.status_code == 200
        except Exception:
            return False


# ── Prompt templates ──────────────────────────────────────────────────

SYMBOL_SUMMARY_SYSTEM = """You are a code analyst. You produce concise, accurate summaries of code symbols.
You MUST respond with valid JSON only. No markdown, no explanation outside the JSON."""

SYMBOL_SUMMARY_PROMPT = """Analyze this code symbol and provide a summary.

Symbol: {name} ({symbol_type})
File: {file_path}
Lines: {start_line}-{end_line}

Source code:
```
{source_code}
```

File imports: {imports}

Respond with this exact JSON format:
{{"summary": "1-2 sentence description of what this symbol does", "role": "{role_hint}", "confidence": 0.85}}

Where role is one of: entry_point, handler, utility, model, config, test, internal, script, api, core, ui

JSON response:"""

FILE_ROLE_SYSTEM = """You are a code analyst. You classify files by their role in a codebase.
You MUST respond with valid JSON only."""

FILE_ROLE_PROMPT = """Classify this file's role in the codebase.

File: {file_path}
Symbols defined: {symbol_names}
Imports: {imports}

First 30 lines:
```
{head}
```

Respond with this exact JSON format:
{{"summary": "1 sentence file purpose", "role": "utility", "confidence": 0.85, "key_exports": ["symbol1", "symbol2"]}}

Where role is one of: api, core, model, utility, config, test, script, ui

JSON response:"""


def _parse_json_response(text: str) -> Optional[Dict[str, Any]]:
    """Best-effort JSON extraction from LLM response."""
    text = text.strip()
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try extracting JSON from markdown code block
    if "```" in text:
        for block in text.split("```"):
            block = block.strip()
            if block.startswith("json"):
                block = block[4:].strip()
            try:
                return json.loads(block)
            except json.JSONDecodeError:
                continue
    # Try finding first { ... }
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            pass
    return None


class TraceAugmenter:
    """
    Augments trace nodes with LLM-generated summaries, roles, and confidence scores.

    Architecture:
    - Reads trace_nodes.jsonl + trace_edges.jsonl (static trace).
    - Calls a fast/small LLM per symbol node.
    - Writes trace_augmented.jsonl (overlay, never modifies static trace).
    - Supports incremental runs via file hash comparison.
    """

    def __init__(
        self,
        index_dir: str | Path,
        repo_root: str | Path,
        llm_client: LLMClient,
    ):
        self.index_dir = Path(index_dir).resolve()
        self.repo_root = Path(repo_root).resolve()
        self.llm = llm_client

        self.augmented_path = self.index_dir / "trace_augmented.jsonl"
        self.augment_manifest_path = self.index_dir / "trace_augment_manifest.json"

    def load_existing(self) -> Dict[str, AugmentationEntry]:
        """Load existing augmentations from disk."""
        entries: Dict[str, AugmentationEntry] = {}
        if self.augmented_path.exists():
            try:
                with open(self.augmented_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            d = json.loads(line)
                            entry = AugmentationEntry.from_dict(d)
                            entries[entry.node_id] = entry
            except Exception as e:
                logger.warning("Failed to load existing augmentations: %s", e)
        return entries

    def load_trace_nodes(self) -> List[Dict[str, Any]]:
        """Load trace nodes from the static trace index."""
        nodes_path = self.index_dir / "trace_nodes.jsonl"
        nodes: List[Dict[str, Any]] = []
        if nodes_path.exists():
            with open(nodes_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        nodes.append(json.loads(line))
        return nodes

    def load_trace_edges(self) -> List[Dict[str, Any]]:
        """Load trace edges from the static trace index."""
        edges_path = self.index_dir / "trace_edges.jsonl"
        edges: List[Dict[str, Any]] = []
        if edges_path.exists():
            with open(edges_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        edges.append(json.loads(line))
        return edges

    def load_file_hashes(self) -> Dict[str, str]:
        """Load file hashes from the trace manifest for staleness detection."""
        manifest_path = self.index_dir / "trace_manifest.json"
        if manifest_path.exists():
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    manifest = json.load(f)
                return manifest.get("file_hashes", {})
            except Exception:
                pass
        return {}

    def _needs_augmentation(
        self,
        node: Dict[str, Any],
        existing: Dict[str, AugmentationEntry],
        file_hashes: Dict[str, str],
    ) -> bool:
        """Check if a node needs (re-)augmentation."""
        node_id = node["id"]
        if node_id not in existing:
            return True
        entry = existing[node_id]
        # Check if source file changed since last augmentation
        file_path = node.get("file_path", "")
        if file_path and entry.file_hash:
            current_hash = file_hashes.get(file_path)
            if current_hash and current_hash != entry.file_hash:
                return True
        return False

    def _read_source_snippet(self, file_path: str, span: Optional[Dict[str, int]], max_chars: int = 2000) -> str:
        """Read source code for a symbol, limited to max_chars."""
        try:
            full_path = self.repo_root / file_path
            if not full_path.exists():
                return ""
            text = full_path.read_text(encoding="utf-8", errors="ignore")
            if span:
                lines = text.splitlines()
                start = max(0, span.get("start_line", 1) - 1)
                end = min(len(lines), span.get("end_line", len(lines)))
                snippet = "\n".join(lines[start:end])
            else:
                snippet = text
            return snippet[:max_chars]
        except Exception:
            return ""

    def _get_file_head(self, file_path: str, max_lines: int = 30) -> str:
        """Read the first N lines of a file."""
        try:
            full_path = self.repo_root / file_path
            if not full_path.exists():
                return ""
            text = full_path.read_text(encoding="utf-8", errors="ignore")
            lines = text.splitlines()[:max_lines]
            return "\n".join(lines)
        except Exception:
            return ""

    def _get_file_imports(self, file_path: str, edges: List[Dict[str, Any]], nodes: Dict[str, Dict[str, Any]]) -> str:
        """Get import statements for a file from trace edges."""
        file_node_id = None
        for nid, n in nodes.items():
            if n.get("file_path") == file_path and n.get("kind") == "file":
                file_node_id = nid
                break
        if not file_node_id:
            return ""
        imports = []
        for e in edges:
            if e.get("source") == file_node_id and e.get("kind") == "imports":
                imp = e.get("metadata", {}).get("import", "")
                if imp:
                    imports.append(imp)
        return ", ".join(imports[:20])

    def augment_symbol(
        self,
        node: Dict[str, Any],
        edges: List[Dict[str, Any]],
        nodes_by_id: Dict[str, Dict[str, Any]],
        file_hashes: Dict[str, str],
    ) -> Optional[AugmentationEntry]:
        """Augment a single symbol node with LLM summary."""
        file_path = node.get("file_path", "")
        span = node.get("span")
        source = self._read_source_snippet(file_path, span)
        if not source:
            return None

        imports = self._get_file_imports(file_path, edges, nodes_by_id)
        symbol_type = node.get("metadata", {}).get("symbol_type", "function")
        role_hint = "utility"  # default hint
        if "test" in file_path.lower() or "test" in node.get("name", "").lower():
            role_hint = "test"

        prompt = SYMBOL_SUMMARY_PROMPT.format(
            name=node.get("name", ""),
            symbol_type=symbol_type,
            file_path=file_path,
            start_line=span.get("start_line", 0) if span else 0,
            end_line=span.get("end_line", 0) if span else 0,
            source_code=source,
            imports=imports or "(none)",
            role_hint=role_hint,
        )

        try:
            text, tokens = self.llm.generate(prompt, system=SYMBOL_SUMMARY_SYSTEM)
        except Exception as e:
            logger.warning("LLM call failed for %s: %s", node.get("name"), e)
            return None

        parsed = _parse_json_response(text)
        if not parsed:
            logger.warning("Failed to parse LLM response for %s", node.get("name"))
            return None

        role = parsed.get("role", "internal")
        if role not in VALID_ROLES:
            role = "internal"

        confidence = float(parsed.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))

        return AugmentationEntry(
            node_id=node["id"],
            summary=str(parsed.get("summary", ""))[:500],
            role=role,
            confidence=confidence,
            augmented_at=datetime.now(timezone.utc).isoformat(),
            model=self.llm.model,
            file_hash=file_hashes.get(file_path),
        )

    def augment_file(
        self,
        node: Dict[str, Any],
        edges: List[Dict[str, Any]],
        nodes_by_id: Dict[str, Dict[str, Any]],
        file_hashes: Dict[str, str],
    ) -> Optional[AugmentationEntry]:
        """Augment a file node with LLM role classification."""
        file_path = node.get("file_path", "")
        head = self._get_file_head(file_path)
        if not head:
            return None

        # Find symbols in this file
        symbol_names = []
        for e in edges:
            if e.get("source") == node["id"] and e.get("kind") == "contains":
                target = nodes_by_id.get(e["target"])
                if target:
                    symbol_names.append(target.get("name", ""))

        imports = self._get_file_imports(file_path, edges, nodes_by_id)

        prompt = FILE_ROLE_PROMPT.format(
            file_path=file_path,
            symbol_names=", ".join(symbol_names[:30]) or "(none)",
            imports=imports or "(none)",
            head=head,
        )

        try:
            text, tokens = self.llm.generate(prompt, system=FILE_ROLE_SYSTEM)
        except Exception as e:
            logger.warning("LLM call failed for file %s: %s", file_path, e)
            return None

        parsed = _parse_json_response(text)
        if not parsed:
            logger.warning("Failed to parse LLM response for file %s", file_path)
            return None

        role = parsed.get("role", "utility")
        if role not in VALID_ROLES:
            role = "utility"

        confidence = float(parsed.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))

        return AugmentationEntry(
            node_id=node["id"],
            summary=str(parsed.get("summary", ""))[:500],
            role=role,
            confidence=confidence,
            augmented_at=datetime.now(timezone.utc).isoformat(),
            model=self.llm.model,
            file_hash=file_hashes.get(file_path),
        )

    def run(
        self,
        progress_callback: Optional[Callable[[str, int, int], None]] = None,
        max_items: Optional[int] = None,
    ) -> AugmentResult:
        """
        Run augmentation on all trace nodes that need it.

        Steps:
        1. Load static trace + existing augmentations.
        2. Identify nodes needing augmentation (new or stale).
        3. Augment symbol nodes first, then file nodes.
        4. Write overlay atomically.
        """
        start = time.monotonic()
        result = AugmentResult()

        nodes = self.load_trace_nodes()
        edges = self.load_trace_edges()
        file_hashes = self.load_file_hashes()
        existing = self.load_existing()

        if not nodes:
            logger.info("No trace nodes found, skipping augmentation")
            return result

        nodes_by_id = {n["id"]: n for n in nodes}
        result.total_nodes = len(nodes)

        # Separate symbol and file nodes
        symbol_nodes = [n for n in nodes if n.get("kind") == "symbol"]
        file_nodes = [n for n in nodes if n.get("kind") == "file"]

        # Filter to nodes needing augmentation
        to_augment_symbols = [n for n in symbol_nodes if self._needs_augmentation(n, existing, file_hashes)]
        to_augment_files = [n for n in file_nodes if self._needs_augmentation(n, existing, file_hashes)]

        total_work = len(to_augment_symbols) + len(to_augment_files)
        if max_items and total_work > max_items:
            to_augment_symbols = to_augment_symbols[:max_items]
            remaining = max_items - len(to_augment_symbols)
            to_augment_files = to_augment_files[:max(0, remaining)]
            total_work = len(to_augment_symbols) + len(to_augment_files)

        logger.info(
            "Augmentation: %d symbols + %d files to process (%d existing, %d total nodes)",
            len(to_augment_symbols), len(to_augment_files), len(existing), len(nodes),
        )

        # Start with existing entries (will be updated/overwritten)
        augmented = dict(existing)
        done = 0

        # Pass 1: Symbol augmentation
        for node in to_augment_symbols:
            if progress_callback:
                progress_callback("augment_symbols", done, total_work)

            entry = self.augment_symbol(node, edges, nodes_by_id, file_hashes)
            if entry:
                augmented[entry.node_id] = entry
                result.augmented += 1
            else:
                result.failed += 1
            done += 1

        # Pass 2: File augmentation
        for node in to_augment_files:
            if progress_callback:
                progress_callback("augment_files", done, total_work)

            entry = self.augment_file(node, edges, nodes_by_id, file_hashes)
            if entry:
                augmented[entry.node_id] = entry
                result.augmented += 1
            else:
                result.failed += 1
            done += 1

        result.skipped = result.total_nodes - total_work

        # Write atomically
        self._write_augmentations(augmented)
        self._write_manifest(result, augmented)

        result.duration_ms = (time.monotonic() - start) * 1000

        if progress_callback:
            progress_callback("augment_complete", total_work, total_work)

        logger.info(
            "Augmentation complete: %d augmented, %d skipped, %d failed in %.1fs",
            result.augmented, result.skipped, result.failed, result.duration_ms / 1000,
        )
        return result

    def _write_augmentations(self, entries: Dict[str, AugmentationEntry]) -> None:
        """Write augmentations atomically."""
        self.index_dir.mkdir(parents=True, exist_ok=True)
        sorted_entries = sorted(entries.values(), key=lambda e: e.node_id)

        tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".jsonl", dir=self.index_dir, delete=False, encoding="utf-8",
        )
        try:
            for entry in sorted_entries:
                tmp.write(json.dumps(entry.to_dict(), sort_keys=True) + "\n")
            tmp.flush()
            os.fsync(tmp.fileno())
            tmp.close()
            os.rename(tmp.name, self.augmented_path)
        except Exception:
            try:
                os.unlink(tmp.name)
            except OSError:
                pass
            raise

    def _write_manifest(self, result: AugmentResult, entries: Dict[str, AugmentationEntry]) -> None:
        """Write augmentation manifest."""
        confidences = [e.confidence for e in entries.values()]
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
        low_conf = sum(1 for c in confidences if c < 0.5)
        validated = sum(1 for e in entries.values() if e.validated)

        manifest = {
            "version": AUGMENT_FORMAT_VERSION,
            "built_at": datetime.now(timezone.utc).isoformat(),
            "model": self.llm.model,
            "counts": {
                "total_nodes": result.total_nodes,
                "augmented": len(entries),
                "validated": validated,
                "low_confidence": low_conf,
            },
            "stats": {
                "avg_confidence": round(avg_conf, 3),
                "tokens_used": result.tokens_used,
                "duration_ms": round(result.duration_ms, 1),
                "augmented_this_run": result.augmented,
                "failed_this_run": result.failed,
                "skipped_this_run": result.skipped,
            },
        }

        tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", dir=self.index_dir, delete=False, encoding="utf-8",
        )
        try:
            json.dump(manifest, tmp, indent=2, sort_keys=True)
            tmp.flush()
            os.fsync(tmp.fileno())
            tmp.close()
            os.rename(tmp.name, self.augment_manifest_path)
        except Exception:
            try:
                os.unlink(tmp.name)
            except OSError:
                pass
            raise

    def status(self) -> Dict[str, Any]:
        """Return augmentation status summary."""
        if not self.augment_manifest_path.exists():
            return {
                "enabled": False,
                "total_nodes": 0,
                "augmented_nodes": 0,
                "validated_nodes": 0,
                "avg_confidence": 0.0,
                "low_confidence_count": 0,
            }

        try:
            with open(self.augment_manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
            counts = manifest.get("counts", {})
            stats = manifest.get("stats", {})
            return {
                "enabled": True,
                "total_nodes": counts.get("total_nodes", 0),
                "augmented_nodes": counts.get("augmented", 0),
                "validated_nodes": counts.get("validated", 0),
                "avg_confidence": stats.get("avg_confidence", 0.0),
                "low_confidence_count": counts.get("low_confidence", 0),
                "last_augment_at": manifest.get("built_at"),
                "model": manifest.get("model"),
            }
        except Exception:
            return {
                "enabled": False,
                "total_nodes": 0,
                "augmented_nodes": 0,
                "validated_nodes": 0,
                "avg_confidence": 0.0,
                "low_confidence_count": 0,
            }
