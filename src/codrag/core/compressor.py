"""
Context compression abstraction for CoDRAG.

Provides a base class and CLaRa sidecar implementation for compressing
retrieved context before injecting it into LLM prompts.
"""

from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CompressResult:
    """Result of a context compression operation."""

    compressed: str
    input_chars: int
    output_chars: int
    input_tokens: int = 0
    output_tokens: int = 0
    compression_ratio: float = 1.0
    timing_ms: float = 0.0
    error: Optional[str] = None


class ContextCompressor(ABC):
    """Abstract base class for context compression providers."""

    @abstractmethod
    def compress(
        self,
        text: str,
        *,
        query: str = "",
        budget_chars: int = 0,
        level: str = "standard",
        timeout_s: float = 30.0,
    ) -> CompressResult:
        """Compress context text.

        Args:
            text: The context string to compress.
            query: The original search query (helps the compressor focus).
            budget_chars: Target output size in characters. 0 = let compressor decide.
            level: Compression aggressiveness: "light", "standard", "aggressive".
            timeout_s: Hard timeout for the compression call.

        Returns:
            CompressResult with compressed text and metadata.
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if the compression service is reachable."""
        pass

    def status(self) -> Dict[str, Any]:
        """Get status info from the compression service."""
        return {"available": self.is_available()}


class ClaraCompressor(ContextCompressor):
    """CLaRa sidecar HTTP client for context compression.

    Calls the CLaRa-Remembers-It-All server at the configured URL.
    API: POST /compress with {memories: [...], query: "..."}

    See: https://github.com/EricBintner/CLaRa-Remembers-It-All
    """

    DEFAULT_URL = "http://localhost:8765"

    def __init__(
        self,
        base_url: str = DEFAULT_URL,
        timeout_s: float = 60.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s

    def compress(
        self,
        text: str,
        *,
        query: str = "",
        budget_chars: int = 0,
        level: str = "standard",
        timeout_s: float = 30.0,
    ) -> CompressResult:
        """Compress context through the CLaRa sidecar server.

        The text is split into chunks (by --- separators) and sent as
        individual memories to CLaRa's /compress endpoint. CLaRa returns
        a compressed answer focused on the query.

        Falls back to returning the original text on any error.
        """
        input_chars = len(text)
        if not text.strip():
            return CompressResult(
                compressed=text,
                input_chars=input_chars,
                output_chars=input_chars,
            )

        # Split context into individual memories (chunks separated by ---)
        memories = [m.strip() for m in text.split("\n\n---\n\n") if m.strip()]
        if not memories:
            memories = [text]

        payload: Dict[str, Any] = {
            "memories": memories,
            "query": query or "Summarize the key information",
        }

        effective_timeout = min(timeout_s, self.timeout_s)
        t0 = time.monotonic()

        try:
            resp = requests.post(
                f"{self.base_url}/compress",
                json=payload,
                timeout=effective_timeout,
            )
            resp.raise_for_status()
            data = resp.json()
        except requests.ConnectionError:
            logger.warning("CLaRa server not reachable at %s", self.base_url)
            return CompressResult(
                compressed=text,
                input_chars=input_chars,
                output_chars=input_chars,
                error=f"CLaRa server not reachable at {self.base_url}",
            )
        except requests.Timeout:
            logger.warning("CLaRa compression timed out after %.1fs", effective_timeout)
            return CompressResult(
                compressed=text,
                input_chars=input_chars,
                output_chars=input_chars,
                error=f"CLaRa compression timed out after {effective_timeout:.1f}s",
            )
        except Exception as e:
            logger.warning("CLaRa compression failed: %s", e)
            return CompressResult(
                compressed=text,
                input_chars=input_chars,
                output_chars=input_chars,
                error=str(e),
            )

        elapsed_ms = (time.monotonic() - t0) * 1000

        if not data.get("success", False):
            error_msg = data.get("error", "CLaRa returned success=false")
            logger.warning("CLaRa compression unsuccessful: %s", error_msg)
            return CompressResult(
                compressed=text,
                input_chars=input_chars,
                output_chars=input_chars,
                timing_ms=elapsed_ms,
                error=error_msg,
            )

        compressed = str(data.get("answer", text))
        output_chars = len(compressed)

        # Respect budget_chars if set
        if budget_chars > 0 and output_chars > budget_chars:
            compressed = compressed[:budget_chars]
            output_chars = len(compressed)

        return CompressResult(
            compressed=compressed,
            input_chars=input_chars,
            output_chars=output_chars,
            input_tokens=int(data.get("original_tokens", 0)),
            output_tokens=int(data.get("compressed_tokens", 0)),
            compression_ratio=float(data.get("compression_ratio", 1.0)),
            timing_ms=elapsed_ms,
        )

    def is_available(self) -> bool:
        """Check if the CLaRa sidecar server is reachable."""
        try:
            resp = requests.get(f"{self.base_url}/health", timeout=3)
            return resp.status_code == 200
        except Exception:
            return False

    def status(self) -> Dict[str, Any]:
        """Get detailed status from the CLaRa server."""
        base = {"available": False, "url": self.base_url}
        try:
            resp = requests.get(f"{self.base_url}/status", timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                base["available"] = True
                base.update(data)
        except Exception:
            pass
        return base


class NoopCompressor(ContextCompressor):
    """Pass-through compressor that returns text unchanged. Used as default."""

    def compress(
        self,
        text: str,
        *,
        query: str = "",
        budget_chars: int = 0,
        level: str = "standard",
        timeout_s: float = 30.0,
    ) -> CompressResult:
        return CompressResult(
            compressed=text,
            input_chars=len(text),
            output_chars=len(text),
        )

    def is_available(self) -> bool:
        return True
