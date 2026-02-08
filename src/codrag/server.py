"""
CoDRAG FastAPI server.

Main HTTP API for the CoDRAG daemon.

Usage:
    python -m codrag.server --repo-root /path/to/repo --index-dir ./codrag_data --port 8400
"""

from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import logging
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from codrag import __version__
from codrag.api.envelope import ApiException, install_api_exception_handlers, ok
from codrag.core import CodeIndex, OllamaEmbedder, NativeEmbedder, ClaraCompressor, NoopCompressor
from codrag.core.project_registry import (
    Project,
    ProjectAlreadyExists,
    ProjectNotFound,
    ProjectRegistry,
    project_index_dir,
)
from codrag.core.repo_policy import (
    ensure_repo_policy,
    load_repo_policy,
    policy_path_for_index,
    write_repo_policy,
    _normalize_path_weights,
)
from codrag.core.repo_profile import profile_repo
from codrag.core.trace import TraceBuilder, TraceIndex, compute_trace_coverage
from codrag.core.watcher import AutoRebuildWatcher
from codrag.mcp_config import generate_mcp_configs

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CoDRAG",
    description="Code Documentation and RAG - Multi-project semantic search platform",
    version=__version__,
)
install_api_exception_handlers(app)

# CORS for dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins to rule out CORS issues
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
_index: Optional[CodeIndex] = None
_trace_index: Optional[TraceIndex] = None
_config: Dict[str, Any] = {}
_build_lock = threading.Lock()
_build_thread: Optional[threading.Thread] = None
_trace_build_thread: Optional[threading.Thread] = None
_last_build_result: Optional[Dict[str, Any]] = None
_last_build_error: Optional[str] = None
_watcher: Optional[AutoRebuildWatcher] = None
_SERVER_STARTED_AT = datetime.now(timezone.utc).isoformat()

_registry: Optional[ProjectRegistry] = None
_project_indexes: Dict[str, CodeIndex] = {}
_project_trace_indexes: Dict[str, TraceIndex] = {}
_project_build_lock = threading.Lock()
_project_build_threads: Dict[str, threading.Thread] = {}
_project_last_build_result: Dict[str, Dict[str, Any]] = {}
_project_last_build_error: Dict[str, str] = {}
_project_trace_build_lock = threading.Lock()
_project_trace_build_threads: Dict[str, threading.Thread] = {}
_project_watchers: Dict[str, AutoRebuildWatcher] = {}


_DEFAULT_UI_CONFIG: Dict[str, Any] = {
    "repo_root": "",
    "core_roots": [],
    "working_roots": [],
    "include_globs": ["**/*.md", "**/*.py", "**/*.ts", "**/*.tsx", "**/*.js", "**/*.json", "**/*.swift", "**/*.jsx", "**/*.css", "**/*.scss", "**/*.html", "**/*.yaml", "**/*.yml", "**/*.toml", "**/*.cfg", "**/*.ini", "**/*.sh", "**/*.rs", "**/*.go", "**/*.java", "**/*.c", "**/*.cpp", "**/*.h", "**/*.hpp", "**/*.txt", "**/*.xml", "**/*.sql", "**/*.rb", "**/*.php", "**/*.kt", "**/*.scala", "**/*.r", "**/*.R", "**/*.m", "**/*.mm"],
    "exclude_globs": [
        "**/.git/**",
        "**/.venv/**",
        "**/__pycache__/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
        "**/*.map",
        "**/*.lock",
    ],
    "max_file_bytes": 400_000,
    "trace": {"enabled": False},
    "auto_rebuild": {"enabled": False, "debounce_ms": 5000},
    "llm_config": None,  # Will be populated with defaults if missing
}


def _ui_config_path() -> Path:
    index_dir = Path(_config.get("index_dir", "./codrag_data"))
    return index_dir / "ui_config.json"


def _default_ui_config() -> Dict[str, Any]:
    repo_root = str(_config.get("repo_root") or "")

    cfg: Dict[str, Any] = dict(_DEFAULT_UI_CONFIG)
    cfg["repo_root"] = repo_root

    if repo_root:
        cfg["core_roots"] = []
# Default LLM Config
    ollama_url = str(_config.get("ollama_url") or "http://localhost:11434")
    model = str(_config.get("model") or "nomic-embed-text")
    
    cfg["llm_config"] = {
        "saved_endpoints": [
            {
                "id": "default_ollama",
                "name": "Default Ollama",
                "provider": "ollama",
                "url": ollama_url,
            }
        ],
        "embedding": {
            "source": "huggingface",
            "hf_repo_id": "nomic-ai/nomic-embed-text-v1.5",
            "hf_downloaded": NativeEmbedder().is_available(),
            "endpoint_id": "default_ollama",
            "model": model,
        },
        "small_model": {
            "enabled": False,
            "endpoint_id": "default_ollama",
            "model": "qwen2.5:3b",
        },
        "large_model": {
            "enabled": False,
            "endpoint_id": "default_ollama",
            "model": "mistral-nemo",
        },
        "clara": {
            "enabled": False,
            "source": "huggingface",
            "hf_repo_id": "apple/CLaRa-7B-Instruct",
        }
    }

    
    return cfg


def _load_ui_config() -> Dict[str, Any]:
    path = _ui_config_path()
    data: Optional[Dict[str, Any]] = None
    if path.exists():
        try:
            raw = json.loads(path.read_text())
            if isinstance(raw, dict):
                data = raw
        except Exception:
            data = None

    cfg = _default_ui_config()
    if data:
        for key in [
            "repo_root",
            "core_roots",
            "working_roots",
            "include_globs",
            "exclude_globs",
            "llm_config",
            "max_file_bytes",
            "trace",
            "auto_rebuild",
        ]:
            if key in data:
                cfg[key] = data[key]
    return cfg


def _save_ui_config(cfg: Dict[str, Any]) -> None:
    path = _ui_config_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cfg, indent=2))


def _get_registry() -> ProjectRegistry:
    global _registry
    if _registry is None:
        _registry = ProjectRegistry()
    return _registry


def _project_to_dict(proj: Project) -> Dict[str, Any]:
    return {
        "id": proj.id,
        "name": proj.name,
        "path": proj.path,
        "mode": proj.mode,
        "config": proj.config,
        "created_at": proj.created_at,
        "updated_at": proj.updated_at,
    }


def _project_id_for_root(root: str) -> str:
    h = hashlib.sha256(root.encode("utf-8")).hexdigest()[:8]
    return f"proj_{h}"


def _current_project() -> Dict[str, Any] | None:
    ui_cfg = _load_ui_config()
    root = str(ui_cfg.get("repo_root") or "") or str(_config.get("repo_root") or "")
    root = root.strip()
    if not root:
        return None

    abs_root = str(Path(root).resolve())
    project_id = _project_id_for_root(abs_root)
    watch = _watcher.status() if _watcher is not None else None

    config: Dict[str, Any] = {
        "include_globs": list(ui_cfg.get("include_globs") or []),
        "exclude_globs": list(ui_cfg.get("exclude_globs") or []),
        "max_file_bytes": int(ui_cfg.get("max_file_bytes") or 500_000),
        "trace": {"enabled": False},
        "auto_rebuild": {"enabled": bool((watch or {}).get("enabled", False))},
    }
    if watch is not None and watch.get("debounce_ms") is not None:
        config["auto_rebuild"]["debounce_ms"] = watch.get("debounce_ms")

    return {
        "id": project_id,
        "name": Path(abs_root).name or project_id,
        "path": abs_root,
        "mode": "standalone",
        "config": config,
        "created_at": _SERVER_STARTED_AT,
        "updated_at": _SERVER_STARTED_AT,
    }


def _require_project(project_id: str) -> Project:
    reg = _get_registry()
    proj = reg.get_project(project_id)
    if proj is None:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message=f"Project with ID '{project_id}' not found",
            hint="Add the project first or select an existing project.",
        )
    return proj


def _project_index_status(idx: CodeIndex, last_build_error: Optional[str] = None) -> Dict[str, Any]:
    st = idx.stats()
    last_error = None
    if last_build_error:
        last_error = {"code": "BUILD_FAILED", "message": str(last_build_error)}

    return {
        "exists": bool(st.get("loaded", False)),
        "total_chunks": int(st.get("total_documents") or 0),
        "embedding_dim": int(st.get("embedding_dim") or 0) if st.get("embedding_dim") is not None else None,
        "embedding_model": st.get("model"),
        "last_build_at": st.get("built_at"),
        "last_error": last_error,
    }


def _project_trace_status(project: Project) -> Dict[str, Any]:
    cfg = project.config or {}
    trace_cfg = cfg.get("trace") if isinstance(cfg, dict) else None
    enabled = bool((trace_cfg or {}).get("enabled", False))

    if not enabled:
        return {
            "enabled": False,
            "exists": False,
            "building": False,
            "counts": {"nodes": 0, "edges": 0},
            "last_build_at": None,
            "last_error": None,
        }

    trace_idx = _get_project_trace_index(project)
    status = trace_idx.status()
    status["enabled"] = True
    status["building"] = _is_project_trace_building(project.id)
    return status


def _get_project_watcher(project: Project) -> Optional[AutoRebuildWatcher]:
    """Get existing watcher for a project (does not create one)."""
    return _project_watchers.get(project.id)


def _get_project_watcher_status(project: Project) -> Dict[str, Any]:
    """Get watcher status for a project."""
    watcher = _get_project_watcher(project)
    if watcher is None:
        return {
            "enabled": False,
            "state": "disabled",
            "stale": False,
            "stale_since": None,
            "pending": False,
            "pending_paths_count": 0,
        }
    return watcher.status()


def _read_json_file(path: Path) -> Optional[Dict[str, Any]]:
    try:
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return None
        return data
    except Exception:
        return None


def _parse_iso_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    s = str(value).strip()
    if not s:
        return None
    try:
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        return datetime.fromisoformat(s)
    except Exception:
        return None


def _project_activity_payload(project: Project, weeks: int) -> Dict[str, Any]:
    idx = _get_project_index(project)
    idx_status = _project_index_status(idx, _project_last_build_error.get(project.id))
    trace_status = _project_trace_status(project)

    idx_dir = project_index_dir(project)
    idx_manifest = _read_json_file(idx_dir / "manifest.json")
    trace_manifest = _read_json_file(idx_dir / "trace_manifest.json")

    start_date = (datetime.now(timezone.utc) - timedelta(days=int(weeks) * 7)).date()
    by_date: Dict[str, Dict[str, Any]] = {}

    def _add(date_str: str, *, embeddings: int = 0, trace: int = 0, builds: int = 0) -> None:
        cur = by_date.get(date_str)
        if cur is None:
            cur = {"date": date_str, "embeddings": 0, "trace": 0, "builds": 0}
            by_date[date_str] = cur
        cur["embeddings"] = int(cur.get("embeddings", 0)) + int(embeddings)
        cur["trace"] = int(cur.get("trace", 0)) + int(trace)
        cur["builds"] = int(cur.get("builds", 0)) + int(builds)

    idx_built_at = (idx_manifest or {}).get("built_at") or idx_status.get("last_build_at")
    idx_dt = _parse_iso_datetime(str(idx_built_at) if idx_built_at else None)
    if idx_dt is not None and idx_dt.date() >= start_date and bool(idx_status.get("exists", False)):
        b = (idx_manifest or {}).get("build")
        embedded_files = 0
        if isinstance(b, dict):
            embedded_files = int(b.get("files_embedded") or 0)
        if embedded_files <= 0:
            embedded_files = int(idx_status.get("total_chunks") or 0)
        _add(idx_dt.date().isoformat(), embeddings=embedded_files, builds=1)

    trace_built_at = None
    if isinstance(trace_manifest, dict):
        trace_built_at = trace_manifest.get("built_at")
    if trace_built_at is None and isinstance(trace_status, dict):
        trace_built_at = trace_status.get("last_build_at")
    trace_dt = _parse_iso_datetime(str(trace_built_at) if trace_built_at else None)
    if trace_dt is not None and trace_dt.date() >= start_date and bool(trace_status.get("exists", False)):
        counts = (trace_manifest or {}).get("counts") if isinstance(trace_manifest, dict) else None
        nodes = 0
        if isinstance(counts, dict):
            nodes = int(counts.get("nodes") or 0)
        if nodes <= 0:
            nodes = int((trace_status.get("counts") or {}).get("nodes") or 0)
        _add(trace_dt.date().isoformat(), trace=nodes, builds=1)

    days = [by_date[k] for k in sorted(by_date.keys())]
    totals = {
        "embeddings": sum(int(d.get("embeddings", 0)) for d in days),
        "trace": sum(int(d.get("trace", 0)) for d in days),
        "builds": sum(int(d.get("builds", 0)) for d in days),
    }
    return {"days": days, "totals": totals}


def _build_coverage_tree(repo_root: Path, include_globs: List[str], exclude_globs: List[str]) -> Dict[str, Any]:
    repo_root = Path(repo_root).expanduser().resolve()
    include_globs = list(include_globs or [])
    exclude_globs = list(exclude_globs or [])

    files = set()
    for pat in include_globs:
        try:
            for p in repo_root.glob(pat):
                files.add(p)
        except Exception:
            continue

    root: Dict[str, Any] = {"name": repo_root.name or "root", "type": "dir", "children": []}

    def _ensure_dir(parent: Dict[str, Any], name: str) -> Dict[str, Any]:
        children = parent.get("children")
        if not isinstance(children, list):
            children = []
            parent["children"] = children
        for c in children:
            if isinstance(c, dict) and c.get("type") == "dir" and c.get("name") == name:
                return c
        node: Dict[str, Any] = {"name": name, "type": "dir", "children": []}
        children.append(node)
        return node

    for p in sorted(files, key=lambda x: str(x)):
        try:
            if not p.is_file():
                continue
            rel_path = str(p.relative_to(repo_root))
        except Exception:
            continue

        parts = list(Path(rel_path).parts)
        if not parts:
            continue

        parent = root
        for part in parts[:-1]:
            parent = _ensure_dir(parent, part)

        status = "excluded" if any(Path(rel_path).match(pat) for pat in exclude_globs) else "indexed"
        children = parent.get("children")
        if not isinstance(children, list):
            children = []
            parent["children"] = children
        children.append({"name": parts[-1], "type": "file", "status": status})

    def _compute(node: Dict[str, Any]) -> tuple[int, int]:
        if node.get("type") != "dir":
            return (1, 1) if node.get("status") == "indexed" else (0, 1)

        indexed = 0
        total = 0
        for child in node.get("children", []) or []:
            if not isinstance(child, dict):
                continue
            i, t = _compute(child)
            indexed += i
            total += t
        node["coverage"] = (indexed / total) if total else 0.0
        return indexed, total

    def _sort(node: Dict[str, Any]) -> None:
        children = node.get("children")
        if not isinstance(children, list):
            return
        children.sort(key=lambda c: (0 if isinstance(c, dict) and c.get("type") == "dir" else 1, str(c.get("name") or "")))
        for child in children:
            if isinstance(child, dict) and child.get("type") == "dir":
                _sort(child)

    _compute(root)
    _sort(root)
    return root


def _get_trace_index() -> TraceIndex:
    global _trace_index
    if _trace_index is None:
        index_dir = Path(_config.get("index_dir") or "./codrag_data")
        _trace_index = TraceIndex(index_dir)
    return _trace_index


def _is_trace_building() -> bool:
    global _trace_build_thread
    return _trace_build_thread is not None and _trace_build_thread.is_alive()


def _start_trace_build(repo_root: str, include_globs: Optional[List[str]] = None, exclude_globs: Optional[List[str]] = None) -> bool:
    global _trace_build_thread, _trace_index
    
    if _is_trace_building():
        return False
    
    index_dir = Path(_config.get("index_dir") or "./codrag_data")
    
    def build_task():
        global _trace_index
        try:
            builder = TraceBuilder(
                repo_root=Path(repo_root),
                index_dir=index_dir,
                include_globs=include_globs,
                exclude_globs=exclude_globs,
            )
            builder.build()
            _trace_index = TraceIndex(index_dir)
            _trace_index.load()
            logger.info("Trace build completed successfully")
        except Exception as e:
            logger.error(f"Trace build failed: {e}")
    
    _trace_build_thread = threading.Thread(target=build_task, daemon=True)
    _trace_build_thread.start()
    return True


# =============================================================================
# Pydantic Models
# =============================================================================

class HealthResponse(BaseModel):
    status: str
    version: str


class BuildRequest(BaseModel):
    project_root: Optional[str] = None
    repo_root: Optional[str] = None
    roots: Optional[List[str]] = None
    include_globs: Optional[List[str]] = None
    exclude_globs: Optional[List[str]] = None
    max_file_bytes: Optional[int] = None


class PolicyRequest(BaseModel):
    repo_root: Optional[str] = None
    force: bool = False


class WatchRequest(BaseModel):
    repo_root: Optional[str] = None
    debounce_ms: Optional[int] = None
    min_rebuild_gap_ms: Optional[int] = None


class SearchRequest(BaseModel):
    query: str
    k: int = 8
    min_score: float = 0.15


class ContextRequest(BaseModel):
    query: str
    k: int = 5
    max_chars: int = 6000
    include_sources: bool = True
    include_scores: bool = False
    min_score: float = 0.15
    structured: bool = False
    trace_expand: bool = False  # Follow trace edges to include structurally related code
    trace_max_chars: int = 2000  # Budget for trace-expanded chunks
    compression: str = "none"  # "none" | "clara"
    compression_level: str = "standard"  # "light" | "standard" | "aggressive"
    compression_target_chars: Optional[int] = None
    compression_timeout_s: float = 30.0


class TraceSearchRequest(BaseModel):
    query: str
    kinds: Optional[List[str]] = None
    limit: int = 20


class ChunkRequest(BaseModel):
    chunk_id: str


class AddProjectRequest(BaseModel):
    path: str
    name: Optional[str] = None
    mode: str = "standalone"
    index_path: Optional[str] = None


class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    path_weights: Optional[Dict[str, float]] = None


class PathWeightsRequest(BaseModel):
    path_weights: Dict[str, float]


class LLMProxyRequest(BaseModel):
    provider: str = "ollama"
    url: str
    api_key: Optional[str] = None


class LLMModelTestRequest(BaseModel):
    provider: str = "ollama"
    url: str
    model: str
    api_key: Optional[str] = None
    kind: str = "completion"



# =============================================================================
# Index Helpers
# =============================================================================

def _create_embedder(embedding_source: Optional[str] = None) -> "Embedder":
    """Create the appropriate embedder based on configuration.

    Priority:
    1. If embedding_source == "ollama" → OllamaEmbedder
    2. If embedding_source == "native" or None → NativeEmbedder (if deps available)
    3. Fallback → OllamaEmbedder
    """
    source = embedding_source or _config.get("embedding_source", "native")

    if source == "ollama":
        ollama_url = _config.get("ollama_url", "http://localhost:11434")
        model = _config.get("model", "nomic-embed-text")
        logger.info("Using OllamaEmbedder (model=%s, url=%s)", model, ollama_url)
        return OllamaEmbedder(model=model, base_url=ollama_url)

    # Default: try native
    native = NativeEmbedder()
    if native.is_available():
        logger.info("Using NativeEmbedder (nomic-embed-text-v1.5 via ONNX)")
        return native

    # Fallback to Ollama if native deps missing
    logger.warning("NativeEmbedder deps not installed; falling back to OllamaEmbedder")
    ollama_url = _config.get("ollama_url", "http://localhost:11434")
    model = _config.get("model", "nomic-embed-text")
    return OllamaEmbedder(model=model, base_url=ollama_url)


def _get_index() -> CodeIndex:
    global _index
    if _index is None:
        index_dir = Path(_config.get("index_dir", "./codrag_data"))
        embedder = _create_embedder()
        _index = CodeIndex(index_dir=index_dir, embedder=embedder)
    return _index


def _is_building() -> bool:
    return _build_thread is not None and _build_thread.is_alive()


def _start_build(
    repo_root: str,
    roots: Optional[List[str]],
    include_globs: Optional[List[str]],
    exclude_globs: Optional[List[str]],
    max_file_bytes: int,
) -> bool:
    global _build_thread

    with _build_lock:
        if _is_building():
            return False

        _build_thread = threading.Thread(
            target=_build_worker,
            args=(repo_root, roots, include_globs, exclude_globs, max_file_bytes),
            daemon=True,
        )
        _build_thread.start()

    return True


def _build_worker(
    repo_root: str,
    roots: Optional[List[str]],
    include_globs: Optional[List[str]],
    exclude_globs: Optional[List[str]],
    max_file_bytes: int,
):
    global _last_build_result, _last_build_error, _build_thread

    try:
        idx = _get_index()
        meta = idx.build(
            repo_root=Path(repo_root),
            roots=roots,
            include_globs=include_globs,
            exclude_globs=exclude_globs,
            max_file_bytes=max_file_bytes,
        )
        _last_build_result = meta
        _last_build_error = None
    except Exception as e:
        logger.exception("Build failed")
        _last_build_error = str(e)
    finally:
        _build_thread = None


def _get_project_index(project: Project) -> CodeIndex:
    idx = _project_indexes.get(project.id)
    idx_dir = project_index_dir(project)
    if idx is None or Path(idx.index_dir).resolve() != Path(idx_dir).resolve():
        # Check project-level embedding config, fall back to global
        embedding_source = (project.config or {}).get("embedding_source")
        embedder = _create_embedder(embedding_source)
        idx = CodeIndex(index_dir=idx_dir, embedder=embedder)
        _project_indexes[project.id] = idx
    return idx


def _is_project_building(project_id: str) -> bool:
    t = _project_build_threads.get(project_id)
    return t is not None and t.is_alive()


def _start_project_build(
    project: Project,
    roots: Optional[List[str]],
    include_globs: Optional[List[str]],
    exclude_globs: Optional[List[str]],
    max_file_bytes: int,
) -> bool:
    with _project_build_lock:
        if _is_project_building(project.id):
            return False

        t = threading.Thread(
            target=_project_build_worker,
            args=(project, roots, include_globs, exclude_globs, max_file_bytes),
            daemon=True,
        )
        _project_build_threads[project.id] = t
        t.start()
        return True


def _project_build_worker(
    project: Project,
    roots: Optional[List[str]],
    include_globs: Optional[List[str]],
    exclude_globs: Optional[List[str]],
    max_file_bytes: int,
):
    try:
        idx = _get_project_index(project)
        meta = idx.build(
            repo_root=Path(project.path),
            roots=roots,
            include_globs=include_globs,
            exclude_globs=exclude_globs,
            max_file_bytes=max_file_bytes,
        )
        _project_last_build_result[project.id] = meta
        _project_last_build_error.pop(project.id, None)
    except Exception as e:
        logger.exception("Build failed")
        _project_last_build_error[project.id] = str(e)
    finally:
        with _project_build_lock:
            cur = threading.current_thread()
            if _project_build_threads.get(project.id) is cur:
                _project_build_threads.pop(project.id, None)


def _get_project_trace_index(project: Project) -> TraceIndex:
    idx = _project_trace_indexes.get(project.id)
    idx_dir = project_index_dir(project)
    if idx is None or Path(idx.index_dir).resolve() != Path(idx_dir).resolve():
        idx = TraceIndex(idx_dir)
        _project_trace_indexes[project.id] = idx
    return idx


def _is_project_trace_building(project_id: str) -> bool:
    t = _project_trace_build_threads.get(project_id)
    return t is not None and t.is_alive()


def _start_project_trace_build(
    project: Project,
    include_globs: Optional[List[str]] = None,
    exclude_globs: Optional[List[str]] = None,
    max_file_bytes: int = 500_000,
) -> bool:
    with _project_trace_build_lock:
        if _is_project_trace_building(project.id):
            return False

        t = threading.Thread(
            target=_project_trace_build_worker,
            args=(project, include_globs, exclude_globs, max_file_bytes),
            daemon=True,
        )
        _project_trace_build_threads[project.id] = t
        t.start()
        return True


def _project_trace_build_worker(
    project: Project,
    include_globs: Optional[List[str]],
    exclude_globs: Optional[List[str]],
    max_file_bytes: int,
):
    try:
        idx_dir = project_index_dir(project)
        builder = TraceBuilder(
            repo_root=Path(project.path),
            index_dir=idx_dir,
            include_globs=include_globs,
            exclude_globs=exclude_globs,
            max_file_bytes=max_file_bytes,
        )
        builder.build()

        trace_idx = TraceIndex(idx_dir)
        trace_idx.load()
        _project_trace_indexes[project.id] = trace_idx
    except Exception as e:
        logger.error(f"Trace build failed: {e}")
    finally:
        with _project_trace_build_lock:
            cur = threading.current_thread()
            if _project_trace_build_threads.get(project.id) is cur:
                _project_trace_build_threads.pop(project.id, None)


# =============================================================================
# Health & Info Endpoints
# =============================================================================

@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(status="ok", version=__version__)


@app.get("/")
def root() -> dict:
    """Root endpoint with API info."""
    return {
        "name": "CoDRAG",
        "version": __version__,
        "description": "Code Documentation and RAG",
        "docs": "/docs",
        "health": "/health",
        "api": "/api/code-index/status",
    }


# =============================================================================
# Embedding Model Endpoints
# =============================================================================

@app.get("/embedding/status")
def embedding_status() -> Dict[str, Any]:
    """Return the current embedding provider status."""
    native = NativeEmbedder()
    deps_ok = native.is_available()

    # Check if model files are already cached in HF cache
    model_cached = False
    model_path = None
    if deps_ok:
        try:
            from huggingface_hub import try_to_load_from_cache  # type: ignore[import-untyped]
            cached = try_to_load_from_cache(
                NativeEmbedder.HF_REPO_ID, NativeEmbedder.ONNX_FILE
            )
            if cached is not None and not isinstance(cached, str):
                model_cached = False
            elif isinstance(cached, str):
                model_cached = True
                model_path = cached
        except Exception:
            pass

    source = _config.get("embedding_source", "native")
    return ok({
        "source": source,
        "native_available": deps_ok,
        "model_cached": model_cached,
        "model_path": model_path,
        "hf_repo_id": NativeEmbedder.HF_REPO_ID,
        "onnx_file": NativeEmbedder.ONNX_FILE,
        "dim": NativeEmbedder.DIM,
    })


@app.post("/embedding/download")
def embedding_download() -> Dict[str, Any]:
    """Download the native embedding model from HuggingFace Hub.

    The model is cached in the standard HF cache directory (~/.cache/huggingface/).
    This is a blocking call — the download happens synchronously.
    """
    native = NativeEmbedder()
    if not native.is_available():
        raise ApiException(
            status_code=400,
            code="NATIVE_DEPS_MISSING",
            message="Native embedding dependencies not installed",
            hint="pip install onnxruntime tokenizers huggingface-hub",
        )

    try:
        model_path = native.download_model()
    except Exception as e:
        raise ApiException(
            status_code=500,
            code="DOWNLOAD_FAILED",
            message=f"Model download failed: {e}",
            hint="Check your internet connection and try again.",
        )

    return ok({
        "status": "downloaded",
        "model_path": model_path,
        "hf_repo_id": NativeEmbedder.HF_REPO_ID,
    })


# =============================================================================
# CLaRa Compression Endpoints
# =============================================================================

@app.get("/clara/status")
def clara_status() -> Dict[str, Any]:
    """Return CLaRa sidecar server status and model info."""
    clara_url = str(_config.get("clara_url", ClaraCompressor.DEFAULT_URL))
    compressor = ClaraCompressor(base_url=clara_url)
    info = compressor.status()
    return ok(info)


@app.get("/clara/health")
def clara_health() -> Dict[str, Any]:
    """Quick health check for the CLaRa sidecar."""
    clara_url = str(_config.get("clara_url", ClaraCompressor.DEFAULT_URL))
    compressor = ClaraCompressor(base_url=clara_url)
    available = compressor.is_available()
    return ok({"url": clara_url, "available": available})


# =============================================================================
# Project Endpoints
# =============================================================================

@app.get("/projects")
def list_projects() -> Dict[str, Any]:
    reg = _get_registry()
    projects: List[Dict[str, Any]] = []
    for p in reg.list_projects():
        projects.append(
            {
                "id": p.id,
                "name": p.name,
                "path": p.path,
                "mode": p.mode,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
                "config": p.config,
            }
        )
    return ok({"projects": projects, "total": len(projects)})


@app.post("/projects")
def add_project(req: AddProjectRequest) -> Dict[str, Any]:
    if req.mode not in ("standalone", "embedded", "custom"):
        raise ApiException(status_code=400, code="VALIDATION_ERROR", message=f"Invalid mode: {req.mode}")

    p = Path(str(req.path)).expanduser().resolve()
    if not p.exists() or not p.is_dir():
        raise ApiException(
            status_code=400,
            code="VALIDATION_ERROR",
            message=f"Path does not exist: {p}",
        )

    # Validate index_path for custom mode
    custom_index_path: Optional[str] = None
    if req.mode == "custom":
        if not req.index_path:
            raise ApiException(
                status_code=400,
                code="VALIDATION_ERROR",
                message="index_path is required for custom mode",
            )
        try:
            ip = Path(req.index_path).expanduser().resolve()
            # We don't necessarily require it to exist yet (we can create it), 
            # but maybe we should ensure parent exists or it's a valid path.
            # For now just resolving it is enough check for basic validity.
            custom_index_path = str(ip)
        except Exception as e:
            raise ApiException(
                status_code=400,
                code="VALIDATION_ERROR",
                message=f"Invalid index_path: {e}",
            )

    reg = _get_registry()
    default_cfg: Dict[str, Any] = {
        "include_globs": list(_DEFAULT_UI_CONFIG.get("include_globs") or []),
        "exclude_globs": list(_DEFAULT_UI_CONFIG.get("exclude_globs") or []),
        "max_file_bytes": int(_DEFAULT_UI_CONFIG.get("max_file_bytes") or 500_000),
        "trace": {"enabled": bool((_DEFAULT_UI_CONFIG.get("trace") or {}).get("enabled", False))},
        "auto_rebuild": {
            "enabled": bool((_DEFAULT_UI_CONFIG.get("auto_rebuild") or {}).get("enabled", False)),
        },
    }
    
    if req.mode == "embedded":
        if "**/.codrag/**" not in default_cfg["exclude_globs"]:
            default_cfg["exclude_globs"].append("**/.codrag/**")
    
    # Store custom index path in config if applicable
    if custom_index_path:
        default_cfg["index_path"] = custom_index_path

    if (_DEFAULT_UI_CONFIG.get("auto_rebuild") or {}).get("debounce_ms") is not None:
        default_cfg["auto_rebuild"]["debounce_ms"] = int(
            (_DEFAULT_UI_CONFIG.get("auto_rebuild") or {}).get("debounce_ms")
        )

    try:
        proj = reg.add_project(path=str(p), name=req.name, mode=req.mode, config=default_cfg)
    except ProjectAlreadyExists:
        raise ApiException(
            status_code=409,
            code="PROJECT_ALREADY_EXISTS",
            message=f"A project already exists at '{p}'",
            hint="Use a different path or remove the existing project first.",
        )

    return ok({"project": _project_to_dict(proj)})


@app.get("/projects/{project_id}")
def get_project(project_id: str) -> Dict[str, Any]:
    proj = _require_project(project_id)
    return ok({"project": _project_to_dict(proj)})


@app.put("/projects/{project_id}")
def update_project(project_id: str, req: UpdateProjectRequest) -> Dict[str, Any]:
    reg = _get_registry()
    try:
        updated = reg.update_project(project_id, name=req.name, config=req.config)
    except ProjectNotFound:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message=f"Project with ID '{project_id}' not found",
            hint="Add the project first or select an existing project.",
        )

    if req.path_weights is not None:
        updated = _persist_path_weights(updated, req.path_weights)

    return ok({"project": _project_to_dict(updated)})


@app.put("/projects/{project_id}/path_weights")
def update_path_weights(project_id: str, req: PathWeightsRequest) -> Dict[str, Any]:
    proj = _require_project(project_id)
    updated = _persist_path_weights(proj, req.path_weights)
    return ok({"project": _project_to_dict(updated), "path_weights": updated.config.get("path_weights", {})})


@app.get("/projects/{project_id}/path_weights")
def get_path_weights(project_id: str) -> Dict[str, Any]:
    proj = _require_project(project_id)
    pw = proj.config.get("path_weights", {})
    return ok({"path_weights": pw})


def _persist_path_weights(proj: Project, raw_weights: Dict[str, float]) -> Project:
    """Normalize and persist path_weights to project config AND repo_policy.json."""
    normalized = _normalize_path_weights(raw_weights)

    # Update project config in SQLite
    reg = _get_registry()
    new_config = dict(proj.config)
    new_config["path_weights"] = normalized
    updated = reg.update_project(proj.id, config=new_config)

    # Also persist to repo_policy.json on disk so next build picks it up
    idx_dir = project_index_dir(proj)
    pp = policy_path_for_index(idx_dir)
    policy = load_repo_policy(pp)
    if policy is not None:
        policy["path_weights"] = normalized
        write_repo_policy(pp, policy)

    # Hot-update the in-memory manifest so searches use new weights immediately
    idx = _project_indexes.get(proj.id)
    if idx is not None and idx._manifest:
        cfg = idx._manifest.get("config")
        if isinstance(cfg, dict):
            cfg["path_weights"] = normalized

    return updated


@app.delete("/projects/{project_id}")
def delete_project(project_id: str, purge: bool = False) -> Dict[str, Any]:
    reg = _get_registry()
    try:
        reg.remove_project(project_id, purge=bool(purge))
    except ProjectNotFound:
        raise ApiException(
            status_code=404,
            code="PROJECT_NOT_FOUND",
            message=f"Project with ID '{project_id}' not found",
            hint="Add the project first or select an existing project.",
        )

    _project_indexes.pop(project_id, None)
    _project_trace_indexes.pop(project_id, None)
    with _project_build_lock:
        _project_build_threads.pop(project_id, None)
        _project_last_build_result.pop(project_id, None)
        _project_last_build_error.pop(project_id, None)
    with _project_trace_build_lock:
        _project_trace_build_threads.pop(project_id, None)

    return ok({"removed": True, "purged": bool(purge)})


@app.get("/projects/{project_id}/status")
def get_project_status(project_id: str) -> Dict[str, Any]:
    proj = _require_project(project_id)
    idx = _get_project_index(proj)

    watch = _get_project_watcher_status(proj)
    data = {
        "building": _is_project_building(proj.id),
        "stale": bool(watch.get("stale", False)),
        "stale_since": watch.get("stale_since"),
        "index": _project_index_status(idx, _project_last_build_error.get(proj.id)),
        "trace": _project_trace_status(proj),
        "watch": watch,
    }
    return ok(data)


@app.post("/projects/{project_id}/watch/start")
def start_project_watch(
    project_id: str,
    debounce_ms: int = Query(5000, ge=500, le=60000),
    min_gap_ms: int = Query(2000, ge=500, le=30000),
) -> Dict[str, Any]:
    """Enable auto-rebuild watcher for a project."""
    proj = _require_project(project_id)
    idx = _get_project_index(proj)
    
    # Stop existing watcher if any
    existing = _project_watchers.get(proj.id)
    if existing is not None:
        existing.stop()
    
    def trigger_build(paths: List[str]) -> bool:
        return _start_project_build(proj) is not None
    
    def is_building() -> bool:
        return _is_project_building(proj.id)
    
    watcher = AutoRebuildWatcher(
        repo_root=Path(proj.path),
        index_dir=idx.index_dir,
        on_trigger_build=trigger_build,
        is_building=is_building,
        debounce_ms=debounce_ms,
        min_rebuild_gap_ms=min_gap_ms,
    )
    watcher.start()
    _project_watchers[proj.id] = watcher
    
    return ok({"enabled": True, "status": watcher.status()})


@app.post("/projects/{project_id}/watch/stop")
def stop_project_watch(project_id: str) -> Dict[str, Any]:
    """Disable auto-rebuild watcher for a project."""
    proj = _require_project(project_id)
    
    watcher = _project_watchers.pop(proj.id, None)
    if watcher is not None:
        watcher.stop()
    
    return ok({"enabled": False})


@app.get("/projects/{project_id}/watch/status")
def get_project_watch_status(project_id: str) -> Dict[str, Any]:
    """Get watcher status for a project."""
    proj = _require_project(project_id)
    return ok(_get_project_watcher_status(proj))


@app.get("/projects/{project_id}/activity")
def get_project_activity(project_id: str, weeks: int = Query(12, ge=1, le=52)) -> Dict[str, Any]:
    proj = _require_project(project_id)
    data = _project_activity_payload(proj, int(weeks))
    return ok(data)


@app.get("/projects/{project_id}/coverage")
def get_project_coverage(project_id: str) -> Dict[str, Any]:
    proj = _require_project(project_id)

    cfg = proj.config or {}
    include_raw = cfg.get("include_globs") if isinstance(cfg, dict) else None
    exclude_raw = cfg.get("exclude_globs") if isinstance(cfg, dict) else None
    include_globs = list(include_raw) if isinstance(include_raw, list) else list(_DEFAULT_UI_CONFIG.get("include_globs") or [])
    exclude_globs = list(exclude_raw) if isinstance(exclude_raw, list) else list(_DEFAULT_UI_CONFIG.get("exclude_globs") or [])

    if proj.mode == "embedded":
        if "**/.codrag/**" not in exclude_globs:
            exclude_globs.append("**/.codrag/**")

    repo_root = Path(proj.path).expanduser().resolve()
    if not repo_root.exists():
        raise ApiException(status_code=400, code="PROJECT_PATH_MISSING", message="Project path not found")

    tree = _build_coverage_tree(repo_root, include_globs, exclude_globs)
    return ok({"tree": tree})


@app.get("/projects/{project_id}/file")
def get_project_file_content(project_id: str, path: str = Query(..., min_length=1)) -> Dict[str, Any]:
    proj = _require_project(project_id)

    cfg = proj.config or {}
    include_raw = cfg.get("include_globs") if isinstance(cfg, dict) else None
    exclude_raw = cfg.get("exclude_globs") if isinstance(cfg, dict) else None
    include_globs = list(include_raw) if isinstance(include_raw, list) else list(_DEFAULT_UI_CONFIG.get("include_globs") or [])
    exclude_globs = list(exclude_raw) if isinstance(exclude_raw, list) else list(_DEFAULT_UI_CONFIG.get("exclude_globs") or [])
    max_file_bytes = int((cfg.get("max_file_bytes") or 400_000) if isinstance(cfg, dict) else 400_000)

    if proj.mode == "embedded":
        if "**/.codrag/**" not in exclude_globs:
            exclude_globs.append("**/.codrag/**")

    repo_root = Path(proj.path).expanduser().resolve()
    if not repo_root.exists() or not repo_root.is_dir():
        raise ApiException(status_code=400, code="PROJECT_PATH_MISSING", message="Project path not found")

    rel_path = Path(str(path).strip().lstrip("/"))
    if rel_path.is_absolute() or ".." in rel_path.parts:
        raise ApiException(
            status_code=400,
            code="INVALID_PATH",
            message="Invalid file path",
            hint="Provide a repo-root-relative path without '..' segments.",
        )

    rel_str = str(rel_path)

    def _glob_match(rel: str, pat: str) -> bool:
        rel = rel.replace("\\", "/")
        pat = str(pat or "")
        if not pat:
            return False
        if fnmatch.fnmatch(rel, pat):
            return True
        if pat.startswith("**/") and fnmatch.fnmatch(rel, pat[3:]):
            return True
        return False

    def _matches_any(rel: str, patterns: List[str]) -> bool:
        for pat in patterns:
            try:
                if _glob_match(rel, str(pat)):
                    return True
            except Exception:
                continue
        return False

    if not _matches_any(rel_str, include_globs):
        raise ApiException(
            status_code=403,
            code="FILE_NOT_INCLUDED",
            message="File is not included by project policy",
            hint="Update include_globs to allow this file.",
        )

    if _matches_any(rel_str, exclude_globs):
        raise ApiException(
            status_code=403,
            code="FILE_EXCLUDED",
            message="File is excluded by project policy",
            hint="Update exclude_globs to allow this file.",
        )

    abs_path = (repo_root / rel_path).resolve()
    if not abs_path.is_relative_to(repo_root):
        raise ApiException(
            status_code=400,
            code="INVALID_PATH",
            message="Invalid file path",
            hint="Provide a repo-root-relative path.",
        )

    if not abs_path.exists() or not abs_path.is_file():
        raise ApiException(status_code=404, code="FILE_NOT_FOUND", message="File not found")

    size = abs_path.stat().st_size
    if size > max_file_bytes:
        raise ApiException(
            status_code=413,
            code="FILE_TOO_LARGE",
            message=f"File exceeds max_file_bytes ({max_file_bytes} bytes)",
            hint="Increase max_file_bytes in project settings or pin a smaller file.",
            details={"max_file_bytes": max_file_bytes, "bytes": size},
        )

    try:
        with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read(max_file_bytes + 1)
    except Exception:
        raise ApiException(status_code=500, code="FILE_READ_FAILED", message="Failed to read file")

    if len(content.encode("utf-8", errors="ignore")) > max_file_bytes:
        raise ApiException(
            status_code=413,
            code="FILE_TOO_LARGE",
            message=f"File exceeds max_file_bytes ({max_file_bytes} bytes)",
            hint="Increase max_file_bytes in project settings or pin a smaller file.",
            details={"max_file_bytes": max_file_bytes, "bytes": size},
        )

    return ok(
        {
            "file": {
                "path": rel_str,
                "name": abs_path.name,
                "content": content,
                "bytes": int(size),
                "max_file_bytes": int(max_file_bytes),
            }
        }
    )


@app.get("/projects/{project_id}/roots")
def get_project_roots(project_id: str) -> Dict[str, Any]:
    """Get available root directories for a project."""
    proj = _require_project(project_id)
    project_root = Path(proj.path).expanduser().resolve()
    
    if not project_root.exists() or not project_root.is_dir():
        raise ApiException(status_code=400, code="PROJECT_PATH_MISSING", message="Project path not found")

    roots: List[str] = []
    
    # Generic discovery: list all top-level directories except ignored ones
    ignore = {".git", ".venv", "node_modules", "__pycache__", ".next", "dist", "build", ".codrag", ".idea", ".vscode"}
    try:
        for item in sorted(project_root.iterdir()):
            if not item.is_dir():
                continue
            if item.name.startswith("."):
                continue
            if item.name in ignore:
                continue
            roots.append(item.name)
    except Exception:
        pass

    return ok({"roots": roots})


@app.get("/projects/{project_id}/files")
def list_project_files(
    project_id: str,
    path: str = "",
    depth: int = 3,
) -> Dict[str, Any]:
    """List files and directories under a project path.

    Parameters
    ----------
    path : str
        Relative path within the project root (empty = project root).
    depth : int
        Maximum recursion depth (default 3, max 10).
    """
    proj = _require_project(project_id)
    project_root = Path(proj.path).expanduser().resolve()

    if not project_root.exists() or not project_root.is_dir():
        raise ApiException(status_code=400, code="PROJECT_PATH_MISSING", message="Project path not found")

    # Resolve target directory safely
    target = (project_root / path).resolve()
    # Security: ensure target is within project root
    try:
        target.relative_to(project_root)
    except ValueError:
        raise ApiException(status_code=400, code="PATH_OUTSIDE_PROJECT", message="Path is outside project root")

    if not target.exists() or not target.is_dir():
        raise ApiException(status_code=400, code="PATH_NOT_FOUND", message=f"Directory not found: {path}")

    ignore = {".git", ".venv", "venv", "node_modules", "__pycache__", ".next", "dist",
              "build", ".codrag", ".idea", ".vscode", ".mypy_cache", ".pytest_cache",
              ".tox", ".eggs", "*.egg-info", ".DS_Store"}
    depth = min(max(depth, 1), 10)

    def _scan(directory: Path, current_depth: int) -> List[Dict[str, Any]]:
        entries: List[Dict[str, Any]] = []
        try:
            items = sorted(directory.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
        except PermissionError:
            return entries

        for item in items:
            name = item.name
            if name in ignore or (name.startswith(".") and name != ".env"):
                continue
            if any(name.endswith(suf) for suf in (".egg-info", ".pyc", ".pyo")):
                continue

            if item.is_dir():
                children = _scan(item, current_depth + 1) if current_depth < depth else []
                entries.append({
                    "name": name,
                    "type": "folder",
                    "children": children,
                })
            elif item.is_file():
                entries.append({
                    "name": name,
                    "type": "file",
                })
        return entries

    tree = _scan(target, 1)
    return ok({"path": path, "tree": tree})


@app.post("/projects/{project_id}/build")
def build_project(project_id: str, full: bool = False) -> Dict[str, Any]:
    proj = _require_project(project_id)

    cfg = proj.config or {}
    include_raw = cfg.get("include_globs") if isinstance(cfg, dict) else None
    exclude_raw = cfg.get("exclude_globs") if isinstance(cfg, dict) else None
    include_globs = list(include_raw) if isinstance(include_raw, list) else None
    exclude_globs = list(exclude_raw) if isinstance(exclude_raw, list) else None
    max_file_bytes = int((cfg.get("max_file_bytes") or 500_000) if isinstance(cfg, dict) else 500_000)

    if proj.mode == "embedded":
        if exclude_globs is None:
            exclude_globs = []
        if "**/.codrag/**" not in exclude_globs:
            exclude_globs.append("**/.codrag/**")

    started = _start_project_build(proj, None, include_globs, exclude_globs, max_file_bytes)
    if not started:
        raise ApiException(status_code=409, code="BUILD_ALREADY_RUNNING", message="Build already running")

    trace_cfg = cfg.get("trace") if isinstance(cfg, dict) else None
    if bool((trace_cfg or {}).get("enabled", False)):
        _start_project_trace_build(proj, include_globs, exclude_globs, max_file_bytes=max_file_bytes)
    return ok({"started": True, "building": True, "build_id": None})


@app.post("/projects/{project_id}/search")
def search_project(project_id: str, req: SearchRequest) -> Dict[str, Any]:
    proj = _require_project(project_id)
    if not req.query.strip():
        raise ApiException(status_code=400, code="VALIDATION_ERROR", message="query is required")

    idx = _get_project_index(proj)
    if not idx.is_loaded():
        raise ApiException(
            status_code=409,
            code="INDEX_NOT_BUILT",
            message="Index has not been built yet",
            hint="Run a build first.",
        )

    results = idx.search(req.query, k=req.k, min_score=req.min_score)
    out: List[Dict[str, Any]] = []
    for r in results:
        d = r.doc
        content = str(d.get("content") or "")
        span = d.get("span")
        if not isinstance(span, dict) or "start_line" not in span or "end_line" not in span:
            span = {"start_line": 1, "end_line": 1}
        out.append(
            {
                "chunk_id": str(d.get("id") or ""),
                "source_path": str(d.get("source_path") or ""),
                "span": span,
                "preview": content[:200],
                "score": float(r.score),
            }
        )
    return ok({"results": out})


def _get_compressor(compression: str) -> "ContextCompressor":
    """Get the appropriate compressor based on the compression parameter."""
    if compression == "clara":
        clara_url = str(_config.get("clara_url", ClaraCompressor.DEFAULT_URL))
        return ClaraCompressor(base_url=clara_url)
    return NoopCompressor()


def _apply_compression(
    context_str: str,
    req: ContextRequest,
) -> Dict[str, Any]:
    """Apply compression to context string and return compression metadata."""
    if req.compression == "none":
        return {"context": context_str, "compression": None}

    compressor = _get_compressor(req.compression)
    budget = req.compression_target_chars or req.max_chars
    result = compressor.compress(
        context_str,
        query=req.query,
        budget_chars=budget,
        level=req.compression_level,
        timeout_s=req.compression_timeout_s,
    )

    compression_meta = {
        "enabled": True,
        "mode": req.compression,
        "level": req.compression_level,
        "input_chars": result.input_chars,
        "output_chars": result.output_chars,
        "input_tokens": result.input_tokens,
        "output_tokens": result.output_tokens,
        "compression_ratio": result.compression_ratio,
        "timing_ms": round(result.timing_ms, 1),
        "error": result.error,
    }

    return {"context": result.compressed, "compression": compression_meta}


@app.post("/projects/{project_id}/context")
def context_project(project_id: str, req: ContextRequest) -> Dict[str, Any]:
    proj = _require_project(project_id)
    if not req.query.strip():
        raise ApiException(status_code=400, code="VALIDATION_ERROR", message="query is required")

    idx = _get_project_index(proj)
    if not idx.is_loaded():
        raise ApiException(
            status_code=409,
            code="INDEX_NOT_BUILT",
            message="Index has not been built yet",
            hint="Run a build first.",
        )

    # Resolve trace index for trace expansion
    trace_idx = None
    if req.trace_expand:
        cfg = proj.config or {}
        trace_cfg = cfg.get("trace") if isinstance(cfg, dict) else None
        if bool((trace_cfg or {}).get("enabled", False)):
            try:
                ti = _get_project_trace_index(proj)
                if ti.exists():
                    if not ti.is_loaded():
                        ti.load()
                    trace_idx = ti
            except Exception:
                pass  # Graceful: fall back to non-expanded context

    if not req.structured:
        ctx = idx.get_context(
            req.query,
            k=req.k,
            max_chars=req.max_chars,
            include_sources=req.include_sources,
            include_scores=req.include_scores,
            min_score=req.min_score,
        )

        comp = _apply_compression(ctx, req)
        resp: Dict[str, Any] = {"context": comp["context"]}
        if comp["compression"] is not None:
            resp["compression"] = comp["compression"]
        return ok(resp)

    # Structured context: use trace expansion if available
    if trace_idx is not None:
        result = idx.get_context_with_trace_expansion(
            req.query,
            trace_index=trace_idx,
            k=req.k,
            max_chars=req.max_chars,
            min_score=req.min_score,
            max_additional_chars=req.trace_max_chars,
        )
        context_str = str(result.get("context") or "")
        comp = _apply_compression(context_str, req)
        resp_data: Dict[str, Any] = {
            "context": comp["context"],
            "chunks": result.get("chunks", []),
            "total_chars": len(comp["context"]),
            "estimated_tokens": len(comp["context"]) // 4,
            "trace_expanded": result.get("trace_expanded", False),
            "trace_nodes_added": result.get("trace_nodes_added", 0),
        }
        if comp["compression"] is not None:
            resp_data["compression"] = comp["compression"]
        return ok(resp_data)

    results = idx.search(req.query, k=req.k, min_score=req.min_score)
    parts: List[str] = []
    chunks: List[Dict[str, Any]] = []
    total = 0

    for r in results:
        d = r.doc
        chunk_id = str(d.get("id") or "")
        source_path = str(d.get("source_path") or "")
        section = str(d.get("section") or "")
        span = d.get("span")
        if not isinstance(span, dict) or "start_line" not in span or "end_line" not in span:
            span = {"start_line": 1, "end_line": 1}

        header_bits: List[str] = []
        if section:
            header_bits.append(section)
        if source_path:
            header_bits.append(f"@{source_path}")
        header = " | ".join(header_bits) if header_bits else source_path

        sep = "\n\n---\n\n" if parts else ""
        remaining = int(req.max_chars) - total
        if remaining <= 0 or len(sep) >= remaining:
            break

        prefix = f"[{header}]\n" if header else ""
        allowed = remaining - len(sep)
        if len(prefix) >= allowed:
            break

        text = str(d.get("content") or "")
        if len(prefix) + len(text) > allowed:
            text_allowed = allowed - len(prefix)
            if text_allowed > 200:
                text = text[: max(0, text_allowed - 3)] + "..."
            else:
                break

        block = prefix + text
        parts.append(sep + block)
        total += len(sep) + len(block)
        chunks.append(
            {
                "chunk_id": chunk_id,
                "source_path": source_path,
                "span": span,
                "score": float(r.score),
                "text": text,
            }
        )
        if text.endswith("..."):
            break

    context_str = "".join(parts)

    comp = _apply_compression(context_str, req)
    resp_data: Dict[str, Any] = {
        "context": comp["context"],
        "chunks": chunks,
        "total_chars": len(comp["context"]),
        "estimated_tokens": len(comp["context"]) // 4,
    }
    if comp["compression"] is not None:
        resp_data["compression"] = comp["compression"]
    return ok(resp_data)


@app.get("/projects/{project_id}/trace/status")
def trace_status_project(project_id: str) -> Dict[str, Any]:
    proj = _require_project(project_id)
    return ok(_project_trace_status(proj))


@app.post("/projects/{project_id}/trace/build")
def build_trace_project(project_id: str) -> Dict[str, Any]:
    proj = _require_project(project_id)

    cfg = proj.config or {}
    trace_cfg = cfg.get("trace") if isinstance(cfg, dict) else None
    if not bool((trace_cfg or {}).get("enabled", False)):
        raise ApiException(
            status_code=409,
            code="TRACE_DISABLED",
            message="Trace is disabled for this project",
            hint="Enable trace in project settings and try again.",
        )

    if _is_project_trace_building(proj.id):
        raise ApiException(status_code=409, code="TRACE_BUILD_ALREADY_RUNNING", message="Trace build already running")

    include_raw = cfg.get("include_globs") if isinstance(cfg, dict) else None
    exclude_raw = cfg.get("exclude_globs") if isinstance(cfg, dict) else None
    include_globs = list(include_raw) if isinstance(include_raw, list) else None
    exclude_globs = list(exclude_raw) if isinstance(exclude_raw, list) else None
    max_file_bytes = int((cfg.get("max_file_bytes") or 500_000) if isinstance(cfg, dict) else 500_000)

    if proj.mode == "embedded":
        if exclude_globs is None:
            exclude_globs = []
        if "**/.codrag/**" not in exclude_globs:
            exclude_globs.append("**/.codrag/**")

    started = _start_project_trace_build(proj, include_globs, exclude_globs, max_file_bytes=max_file_bytes)
    if not started:
        raise ApiException(status_code=409, code="TRACE_BUILD_ALREADY_RUNNING", message="Trace build already running")
    
    return ok({"started": True, "building": True})


@app.get("/projects/{project_id}/trace/coverage")
def trace_coverage_project(project_id: str) -> Dict[str, Any]:
    """Get trace coverage: traced, untraced, stale, and ignored files."""
    proj = _require_project(project_id)

    cfg = proj.config or {}
    trace_cfg = cfg.get("trace") if isinstance(cfg, dict) else None
    if not bool((trace_cfg or {}).get("enabled", False)):
        raise ApiException(
            status_code=409,
            code="TRACE_DISABLED",
            message="Trace is disabled for this project",
            hint="Enable trace in project settings.",
        )

    include_raw = cfg.get("include_globs") if isinstance(cfg, dict) else None
    exclude_raw = cfg.get("exclude_globs") if isinstance(cfg, dict) else None
    include_globs = list(include_raw) if isinstance(include_raw, list) else None
    exclude_globs = list(exclude_raw) if isinstance(exclude_raw, list) else None

    # Merge trace-specific ignore patterns from project config
    trace_ignore = (trace_cfg or {}).get("ignore_patterns", [])
    if isinstance(trace_ignore, list) and trace_ignore:
        if exclude_globs is None:
            exclude_globs = [
                "**/node_modules/**", "**/.git/**", "**/venv/**",
                "**/__pycache__/**", "**/dist/**", "**/build/**",
            ]
        exclude_globs = list(exclude_globs) + [str(p) for p in trace_ignore]

    max_file_bytes = int((cfg.get("max_file_bytes") or 500_000) if isinstance(cfg, dict) else 500_000)
    idx_dir = project_index_dir(proj)

    coverage = compute_trace_coverage(
        repo_root=Path(proj.path),
        index_dir=idx_dir,
        include_globs=include_globs,
        exclude_globs=exclude_globs,
        max_file_bytes=max_file_bytes,
    )
    coverage["building"] = _is_project_trace_building(proj.id)
    return ok(coverage)


class TraceIgnoreRequest(BaseModel):
    action: str  # "add" | "remove"
    patterns: List[str]


@app.post("/projects/{project_id}/trace/ignore")
def update_trace_ignore(project_id: str, req: TraceIgnoreRequest) -> Dict[str, Any]:
    """Add or remove trace-specific ignore patterns."""
    proj = _require_project(project_id)

    if req.action not in ("add", "remove"):
        raise ApiException(status_code=400, code="VALIDATION_ERROR", message="action must be 'add' or 'remove'")
    if not req.patterns:
        raise ApiException(status_code=400, code="VALIDATION_ERROR", message="patterns list is required")

    cfg = dict(proj.config or {})
    trace_cfg = dict(cfg.get("trace") or {})
    current_patterns: List[str] = list(trace_cfg.get("ignore_patterns") or [])

    if req.action == "add":
        for p in req.patterns:
            p = str(p).strip()
            if p and p not in current_patterns:
                current_patterns.append(p)
    else:
        remove_set = set(str(p).strip() for p in req.patterns)
        current_patterns = [p for p in current_patterns if p not in remove_set]

    trace_cfg["ignore_patterns"] = current_patterns
    cfg["trace"] = trace_cfg
    proj.config = cfg
    _registry.update(proj)

    return ok({"ignore_patterns": current_patterns})


@app.get("/projects/{project_id}/trace/search")
def search_trace_project(project_id: str, query: str, kind: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
    proj = _require_project(project_id)
    
    if not query.strip():
        raise ApiException(status_code=400, code="VALIDATION_ERROR", message="query is required")

    cfg = proj.config or {}
    trace_cfg = cfg.get("trace") if isinstance(cfg, dict) else None
    if not bool((trace_cfg or {}).get("enabled", False)):
        raise ApiException(
            status_code=409,
            code="TRACE_DISABLED",
            message="Trace is disabled for this project",
            hint="Enable trace in project settings and build the trace index.",
        )
    
    trace_idx = _get_project_trace_index(proj)
    if not trace_idx.exists():
        raise ApiException(
            status_code=409,
            code="TRACE_NOT_BUILT",
            message="Trace index has not been built yet",
            hint="Run a trace build first.",
        )
    
    if not trace_idx.is_loaded():
        trace_idx.load()
    
    results = trace_idx.search_nodes(query, kind=kind, limit=min(limit, 100))
    return ok({"nodes": results})


@app.post("/projects/{project_id}/trace/search")
def trace_search_project(project_id: str, req: TraceSearchRequest) -> Dict[str, Any]:
    proj = _require_project(project_id)

    if not str(req.query or "").strip():
        raise ApiException(status_code=400, code="VALIDATION_ERROR", message="query is required")

    cfg = proj.config or {}
    trace_cfg = cfg.get("trace") if isinstance(cfg, dict) else None
    if not bool((trace_cfg or {}).get("enabled", False)):
        raise ApiException(
            status_code=409,
            code="TRACE_DISABLED",
            message="Trace is disabled for this project",
            hint="Enable trace in project settings and build the trace index.",
        )

    trace_idx = _get_project_trace_index(proj)
    if not trace_idx.exists():
        raise ApiException(
            status_code=409,
            code="TRACE_NOT_BUILT",
            message="Trace index has not been built yet",
            hint="Run a trace build first.",
        )

    if not trace_idx.is_loaded():
        trace_idx.load()

    hard_cap = 100
    limit = min(int(req.limit or 0) if req.limit is not None else 20, hard_cap)
    if limit <= 0:
        limit = 20

    nodes = trace_idx.search_nodes(req.query, kind=None, limit=hard_cap)
    if isinstance(req.kinds, list) and req.kinds:
        kinds = {str(k).strip() for k in req.kinds if isinstance(k, str) and k.strip()}
        if kinds:
            nodes = [n for n in nodes if str(n.get("kind") or "") in kinds]
    nodes = nodes[:limit]

    return ok({"nodes": nodes})


@app.get("/projects/{project_id}/trace/node/{node_id}")
@app.get("/projects/{project_id}/trace/nodes/{node_id}")
def get_trace_node(project_id: str, node_id: str) -> Dict[str, Any]:
    proj = _require_project(project_id)

    cfg = proj.config or {}
    trace_cfg = cfg.get("trace") if isinstance(cfg, dict) else None
    if not bool((trace_cfg or {}).get("enabled", False)):
        raise ApiException(
            status_code=409,
            code="TRACE_DISABLED",
            message="Trace is disabled for this project",
            hint="Enable trace in project settings and build the trace index.",
        )
    
    trace_idx = _get_project_trace_index(proj)
    if not trace_idx.exists():
        raise ApiException(status_code=409, code="TRACE_NOT_BUILT", message="Trace index has not been built yet")
    
    if not trace_idx.is_loaded():
        trace_idx.load()
    
    node = trace_idx.get_node(node_id)
    if node is None:
        raise ApiException(status_code=404, code="NODE_NOT_FOUND", message=f"Node not found: {node_id}")
    
    in_degree, out_degree = trace_idx.node_degree(node_id)
    return ok({"node": node, "in_degree": in_degree, "out_degree": out_degree})


@app.get("/projects/{project_id}/trace/neighbors/{node_id}")
@app.get("/projects/{project_id}/trace/nodes/{node_id}/neighbors")
def get_trace_node_neighbors(
    project_id: str,
    node_id: str,
    direction: str = "both",
    edge_kinds: Optional[List[str]] = Query(None),
    hops: int = 1,
    max_nodes: int = 25,
    max_edges: int = 50,
) -> Dict[str, Any]:
    proj = _require_project(project_id)

    cfg = proj.config or {}
    trace_cfg = cfg.get("trace") if isinstance(cfg, dict) else None
    if not bool((trace_cfg or {}).get("enabled", False)):
        raise ApiException(
            status_code=409,
            code="TRACE_DISABLED",
            message="Trace is disabled for this project",
            hint="Enable trace in project settings and build the trace index.",
        )
    
    trace_idx = _get_project_trace_index(proj)
    if not trace_idx.exists():
        raise ApiException(status_code=409, code="TRACE_NOT_BUILT", message="Trace index has not been built yet")
    
    if not trace_idx.is_loaded():
        trace_idx.load()
    
    node = trace_idx.get_node(node_id)
    if node is None:
        raise ApiException(status_code=404, code="NODE_NOT_FOUND", message=f"Node not found: {node_id}")
    
    edge_kinds_list: Optional[List[str]] = None
    if edge_kinds:
        cleaned: List[str] = []
        for v in edge_kinds:
            for part in str(v).split(","):
                p = part.strip()
                if p:
                    cleaned.append(p)
        edge_kinds_list = cleaned or None

    if edge_kinds_list is None:
        edge_kinds_list = ["imports"]

    neighbors = trace_idx.get_neighbors(
        node_id,
        direction=direction,
        edge_kinds=edge_kinds_list,
        max_nodes=min(max_nodes, 100),
    )

    edges: List[Dict[str, Any]] = []
    seen_edges: set[str] = set()
    for e in list(neighbors.get("in_edges") or []) + list(neighbors.get("out_edges") or []):
        eid = str(e.get("id") or "")
        if eid and eid in seen_edges:
            continue
        if eid:
            seen_edges.add(eid)
        edges.append(e)

    max_edges_cap = 200
    edges = edges[: min(int(max_edges), max_edges_cap)] if int(max_edges) > 0 else edges[:50]

    nodes_out: List[Dict[str, Any]] = []
    seen_nodes: set[str] = set()
    for n in [node] + list(neighbors.get("in_nodes") or []) + list(neighbors.get("out_nodes") or []):
        nid = str((n or {}).get("id") or "")
        if not nid or nid in seen_nodes:
            continue
        seen_nodes.add(nid)
        nodes_out.append(n)

    return ok({"nodes": nodes_out, "edges": edges})


@app.get("/llm/status")
@app.get("/api/llm/status")
def get_llm_status() -> Dict[str, Any]:
    ollama_url = str(_config.get("ollama_url") or "http://localhost:11434").rstrip("/")
    connected = False
    models: List[str] = []
    try:
        r = requests.get(f"{ollama_url}/api/tags", timeout=2)
        if r.status_code == 200:
            payload = r.json()
            raw_models = payload.get("models") if isinstance(payload, dict) else None
            if isinstance(raw_models, list):
                for m in raw_models:
                    if isinstance(m, dict) and m.get("name"):
                        models.append(str(m.get("name")))
            connected = True
    except Exception:
        connected = False
        models = []

    clara_url = str(_config.get("clara_url", ClaraCompressor.DEFAULT_URL))
    clara_compressor = ClaraCompressor(base_url=clara_url)
    clara_connected = clara_compressor.is_available()

    return ok(
        {
            "ollama": {"url": ollama_url, "connected": connected, "models": models},
            "clara": {"url": clara_url, "connected": clara_connected},
        }
    )


@app.post("/llm/test")
@app.post("/api/llm/test")
def test_llm() -> Dict[str, Any]:
    ollama_url = str(_config.get("ollama_url") or "http://localhost:11434").rstrip("/")
    ollama_connected = False
    try:
        r = requests.get(f"{ollama_url}/api/tags", timeout=2)
        if r.status_code == 200:
            ollama_connected = True
    except Exception:
        ollama_connected = False

    return ok(
        {
            "ollama": {"connected": ollama_connected},
            "clara": {"connected": False},
        }
    )


@app.post("/api/llm/proxy/models")
def proxy_models(req: LLMProxyRequest) -> Dict[str, Any]:
    url = req.url.rstrip("/")
    models: List[str] = []
    
    try:
        if req.provider == "ollama":
            r = requests.get(f"{url}/api/tags", timeout=5)
            if r.status_code == 200:
                data = r.json()
                for m in data.get("models", []):
                    if isinstance(m, dict) and "name" in m:
                        models.append(m["name"])
        
        elif req.provider in ("openai", "openai-compatible", "anthropic"):
            headers = {}
            if req.api_key:
                headers["Authorization"] = f"Bearer {req.api_key}"
            
            # OpenAI/compatible usually uses /v1/models
            target = f"{url}/models"
            if "v1" not in url and req.provider != "anthropic":
                 target = f"{url}/v1/models"
            
            r = requests.get(target, headers=headers, timeout=5)
            if r.status_code == 200:
                data = r.json()
                for m in data.get("data", []):
                    if isinstance(m, dict) and "id" in m:
                        models.append(m["id"])
                        
    except Exception as e:
        raise ApiException(status_code=500, code="CONNECTION_FAILED", message=str(e))

    return ok({"models": models})


@app.post("/api/llm/proxy/test")
def proxy_test(req: LLMProxyRequest) -> Dict[str, Any]:
    url = req.url.rstrip("/")
    success = False
    message = ""
    models: List[str] = []

    try:
        if req.provider == "ollama":
            r = requests.get(f"{url}/api/tags", timeout=5)
            if r.status_code == 200:
                success = True
                data = r.json()
                models = [m["name"] for m in data.get("models", []) if "name" in m]
                message = f"Connected to Ollama v{r.headers.get('version', 'unknown')}"
            else:
                message = f"HTTP {r.status_code}: {r.text[:100]}"
        
        else:
            headers = {}
            if req.api_key:
                headers["Authorization"] = f"Bearer {req.api_key}"
            
            target = f"{url}/models"
            if "v1" not in url and req.provider != "anthropic":
                 target = f"{url}/v1/models"

            r = requests.get(target, headers=headers, timeout=5)
            if r.status_code == 200:
                success = True
                data = r.json()
                models = [m.get("id") for m in data.get("data", []) if "id" in m]
                message = "Connected successfully"
            else:
                message = f"HTTP {r.status_code}: {r.text[:100]}"

    except Exception as e:
        message = str(e)

    return ok({"success": success, "message": message, "models": models})


@app.post("/api/llm/proxy/test-model")
def proxy_test_model(req: LLMModelTestRequest) -> Dict[str, Any]:
    url = req.url.rstrip("/")
    success = False
    message = ""
    
    try:
        if req.provider == "ollama":
            if req.kind == "embedding":
                r = requests.post(
                    f"{url}/api/embeddings",
                    json={"model": req.model, "prompt": "Test embedding"},
                    timeout=10
                )
            else:
                r = requests.post(
                    f"{url}/api/generate",
                    json={"model": req.model, "prompt": "Hi", "stream": False},
                    timeout=10
                )
            
            if r.status_code == 200:
                success = True
                message = "Model responded successfully"
            else:
                message = f"HTTP {r.status_code}: {r.text[:100]}"
                
        elif req.provider in ("openai", "openai-compatible"):
            headers = {}
            if req.api_key:
                headers["Authorization"] = f"Bearer {req.api_key}"
            
            base = url if "v1" in url else f"{url}/v1"
            
            if req.kind == "embedding":
                r = requests.post(
                    f"{base}/embeddings",
                    headers=headers,
                    json={"model": req.model, "input": "Test"},
                    timeout=10
                )
            else:
                r = requests.post(
                    f"{base}/chat/completions",
                    headers=headers,
                    json={
                        "model": req.model, 
                        "messages": [{"role": "user", "content": "Hi"}],
                        "max_tokens": 5
                    },
                    timeout=10
                )
                
            if r.status_code == 200:
                success = True
                message = "Model responded successfully"
            else:
                message = f"HTTP {r.status_code}: {r.text[:100]}"

    except Exception as e:
        message = str(e)

    return ok({"success": success, "message": message})


@app.get("/api/code-index/config")
def get_ui_config():
    return _load_ui_config()


@app.put("/api/code-index/config")
def put_ui_config(data: Dict[str, Any]):
    cfg = _load_ui_config()
    for key in [
        "repo_root",
        "core_roots",
        "working_roots",
        "include_globs",
        "llm_config",
        "exclude_globs",
        "max_file_bytes",
        "trace",
        "auto_rebuild",
    ]:
        if key in data:
            cfg[key] = data[key]
    _save_ui_config(cfg)
    return cfg


@app.get("/api/code-index/mcp-config")
def mcp_config(
    request: Request,
    ide: str = "cursor",
    mode: str = "auto",
    project_id: Optional[str] = None,
    daemon_url: Optional[str] = None,
):
    resolved_daemon_url = daemon_url or str(request.base_url).rstrip("/")
    try:
        configs = generate_mcp_configs(
            ide=ide,
            daemon_url=resolved_daemon_url,
            codrag_command="codrag",
            mode=mode,
            project_id=project_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if ide == "all":
        return {"daemon_url": resolved_daemon_url, "configs": configs}

    key = next(iter(configs))
    return {"daemon_url": resolved_daemon_url, **configs[key]}


@app.get("/api/code-index/available-roots")
def available_roots(repo_root: Optional[str] = None):
    cfg = _load_ui_config()
    root = repo_root or str(cfg.get("repo_root") or "") or _config.get("repo_root")
    if not root:
        raise HTTPException(status_code=400, detail="repo_root is required")

    project_root = Path(root).resolve()
    if not project_root.exists() or not project_root.is_dir():
        raise HTTPException(status_code=400, detail=f"repo_root not found: {project_root}")

    roots: List[str] = []
    
    # Generic discovery: list all top-level directories except ignored ones
    ignore = {".git", ".venv", "node_modules", "__pycache__", ".next", "dist", "build", ".codrag", ".idea", ".vscode"}
    try:
        for item in sorted(project_root.iterdir()):
            if not item.is_dir():
                continue
            if item.name.startswith("."):
                continue
            if item.name in ignore:
                continue
            roots.append(item.name)
    except Exception:
        pass

    return {"roots": roots}


# =============================================================================
# Code Index API (Working Endpoints)
# =============================================================================

@app.get("/api/code-index/status")
def status():
    """Get index status and build state."""
    idx = _get_index()
    return {
        "index": idx.stats(),
        "building": _is_building(),
        "last_build": _last_build_result,
        "last_error": _last_build_error,
        "watch": _watcher.status() if _watcher is not None else {"enabled": False, "state": "disabled"},
        "context_defaults": {
            "k": 5,
            "max_chars": 6000,
        },
        "config": {
            "repo_root": _config.get("repo_root"),
            "index_dir": _config.get("index_dir"),
            "ollama_url": _config.get("ollama_url"),
            "model": _config.get("model"),
        },
    }


@app.post("/api/code-index/build")
def build(req: BuildRequest):
    """Start an async index build."""

    ui_cfg = _load_ui_config()
    repo_root = req.repo_root or req.project_root or str(ui_cfg.get("repo_root") or "") or _config.get("repo_root")
    if not repo_root:
        raise HTTPException(status_code=400, detail="repo_root is required")

    roots = req.roots
    if roots is None:
        combined = list(ui_cfg.get("core_roots") or []) + list(ui_cfg.get("working_roots") or [])
        roots = combined or None

    include_globs = req.include_globs if req.include_globs is not None else (ui_cfg.get("include_globs") or None)
    exclude_globs = req.exclude_globs if req.exclude_globs is not None else (ui_cfg.get("exclude_globs") or None)
    max_file_bytes = int(req.max_file_bytes) if req.max_file_bytes is not None else int(ui_cfg.get("max_file_bytes") or 500_000)

    started = _start_build(repo_root, roots, include_globs, exclude_globs, max_file_bytes)
    if not started:
        return {"started": False, "building": True}
    return {"started": True}


@app.get("/api/code-index/profile")
def profile(repo_root: Optional[str] = None):
    """Profile a repo to recommend include/exclude patterns and retrieval roles."""
    root = repo_root or _config.get("repo_root")
    if not root:
        raise HTTPException(status_code=400, detail="repo_root is required")

    return profile_repo(Path(root))


@app.post("/api/code-index/policy")
def policy(req: PolicyRequest):
    """Get (and optionally regenerate) the persisted repo policy for this index."""
    root = req.repo_root or _config.get("repo_root")
    if not root:
        raise HTTPException(status_code=400, detail="repo_root is required")

    idx = _get_index()
    pol = ensure_repo_policy(idx.index_dir, Path(root), force=req.force)
    return {"policy": pol}


def _ensure_watcher(repo_root: str, debounce_ms: Optional[int], min_gap_ms: Optional[int]) -> AutoRebuildWatcher:
    global _watcher

    idx = _get_index()
    root_path = Path(repo_root)

    def _trigger(_paths: List[str]) -> bool:
        ui_cfg = _load_ui_config()
        combined = list(ui_cfg.get("core_roots") or []) + list(ui_cfg.get("working_roots") or [])
        roots = combined or None

        include_globs = ui_cfg.get("include_globs") or None
        exclude_globs = ui_cfg.get("exclude_globs") or None
        max_file_bytes = int(ui_cfg.get("max_file_bytes") or 500_000)

        return _start_build(repo_root, roots, include_globs, exclude_globs, max_file_bytes)

    if _watcher is None:
        _watcher = AutoRebuildWatcher(
            repo_root=root_path,
            index_dir=idx.index_dir,
            on_trigger_build=_trigger,
            is_building=_is_building,
            debounce_ms=int(debounce_ms) if debounce_ms is not None else 5000,
            min_rebuild_gap_ms=int(min_gap_ms) if min_gap_ms is not None else 2000,
        )
        return _watcher

    return _watcher


@app.get("/api/code-index/watch/status")
def watch_status(repo_root: Optional[str] = None):
    root = repo_root or _config.get("repo_root")
    if not root:
        raise HTTPException(status_code=400, detail="repo_root is required")

    if _watcher is None:
        return {"watch": {"enabled": False, "state": "disabled"}}
    return {"watch": _watcher.status()}


@app.post("/api/code-index/watch/start")
def watch_start(req: WatchRequest):
    root = req.repo_root or _config.get("repo_root")
    if not root:
        raise HTTPException(status_code=400, detail="repo_root is required")

    w = _ensure_watcher(root, req.debounce_ms, req.min_rebuild_gap_ms)
    w.start()
    return {"watch": w.status()}


@app.post("/api/code-index/watch/stop")
def watch_stop():
    global _watcher

    if _watcher is None:
        return {"watch": {"enabled": False, "state": "disabled"}}
    _watcher.stop()
    return {"watch": _watcher.status()}


@app.post("/api/code-index/search")
def search(req: SearchRequest):
    """Search the index."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query is required")

    idx = _get_index()
    policy = idx.query_policy(req.query)
    results = idx.search(req.query, k=req.k, min_score=req.min_score)

    return {
        "results": [
            {"doc": r.doc, "score": r.score}
            for r in results
        ],
        "meta": {"query": req.query, "policy": policy},
    }


@app.post("/api/code-index/context")
def context(req: ContextRequest):
    """Get assembled context for LLM injection."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query is required")

    idx = _get_index()
    if req.structured:
        return idx.get_context_structured(
            req.query,
            k=req.k,
            max_chars=req.max_chars,
            min_score=req.min_score,
        )

    policy = idx.query_policy(req.query)
    ctx = idx.get_context(
        req.query,
        k=req.k,
        max_chars=req.max_chars,
        include_sources=req.include_sources,
        include_scores=req.include_scores,
        min_score=req.min_score,
    )
    return {"context": ctx, "meta": {"query": req.query, "policy": policy}}


@app.post("/api/code-index/chunk")
def chunk(req: ChunkRequest):
    """Get a specific chunk by ID."""
    idx = _get_index()
    doc = idx.get_chunk(req.chunk_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Chunk not found")
    return {"chunk": doc}


# =============================================================================
# Server Configuration & Main
# =============================================================================

def configure(
    repo_root: Optional[str] = None,
    index_dir: str = "./codrag_data",
    ollama_url: str = "http://localhost:11434",
    model: str = "nomic-embed-text",
):
    """Configure the server before starting."""
    global _config, _index, _watcher
    if _watcher is not None:
        try:
            _watcher.stop()
        except Exception:
            pass
        _watcher = None
    _config = {
        "repo_root": repo_root,
        "index_dir": index_dir,
        "ollama_url": ollama_url,
        "model": model,
    }
    _index = None


def mount_dashboard():
    """Mount the static dashboard if available."""
    dashboard_dir = Path(__file__).parent / "dashboard" / "dist"
    if dashboard_dir.exists():
        app.mount("/ui", StaticFiles(directory=str(dashboard_dir), html=True), name="dashboard")
        logger.info(f"Dashboard mounted at /ui from {dashboard_dir}")
    else:
        logger.warning(f"Dashboard not found at {dashboard_dir} - run 'npm run build' in dashboard/")


def main():
    parser = argparse.ArgumentParser(description="CoDRAG Server")
    parser.add_argument("--repo-root", help="Default repository root to index")
    parser.add_argument("--index-dir", default="./codrag_data", help="Directory to store index")
    parser.add_argument("--ollama-url", default="http://localhost:11434", help="Ollama API URL")
    parser.add_argument("--model", default="nomic-embed-text", help="Embedding model name")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8400, help="Port to bind to")
    args = parser.parse_args()

    configure(
        repo_root=args.repo_root,
        index_dir=args.index_dir,
        ollama_url=args.ollama_url,
        model=args.model,
    )

    mount_dashboard()

    import uvicorn
    logger.info(f"Starting CoDRAG server on {args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
