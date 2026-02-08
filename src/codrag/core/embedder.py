"""
Embedder abstraction for CoDRAG.

Provides a base class and Ollama implementation for generating embeddings.
"""

from __future__ import annotations

import logging
import random
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, List, Optional

import requests

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EmbeddingResult:
    """Result of an embedding operation."""
    vector: List[float]
    model: str


class Embedder(ABC):
    """Abstract base class for embedding providers."""

    @abstractmethod
    def embed(self, text: str) -> EmbeddingResult:
        """Generate an embedding vector for the given text."""
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[EmbeddingResult]:
        """Generate embeddings for multiple texts."""
        pass


class OllamaEmbedder(Embedder):
    """Ollama-based embedder using the /api/embeddings endpoint."""

    def __init__(
        self,
        model: str = "nomic-embed-text",
        base_url: str = "http://localhost:11434",
        timeout_s: int = 60,
        max_retries: int = 4,
        keep_alive: str = "10m",
    ):
        """
        Initialize the Ollama embedder.

        Args:
            model: Ollama embedding model name
            base_url: Ollama API base URL
            timeout_s: Request timeout in seconds
            max_retries: Number of retry attempts for transient failures
            keep_alive: How long to keep the model loaded (e.g., "10m", "1h")
        """
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.timeout_s = timeout_s
        self.max_retries = max_retries
        self.keep_alive = keep_alive

    def embed(self, text: str) -> EmbeddingResult:
        """Generate an embedding for a single text."""
        payload = {
            "model": self.model,
            "prompt": text,
            "keep_alive": self.keep_alive,
        }

        last_err: Optional[Exception] = None
        for attempt in range(max(1, self.max_retries)):
            try:
                resp = requests.post(
                    f"{self.base_url}/api/embeddings",
                    json=payload,
                    timeout=self.timeout_s,
                )

                if resp.status_code >= 500:
                    raise requests.HTTPError(
                        f"{resp.status_code} Server Error for url: {resp.url}",
                        response=resp,
                    )

                resp.raise_for_status()
                data = resp.json() or {}
                emb = data.get("embedding")
                if not isinstance(emb, list) or not emb:
                    raise ValueError("Ollama embeddings response missing 'embedding'")
                return EmbeddingResult(
                    vector=[float(x) for x in emb],
                    model=data.get("model") or self.model,
                )
            except (requests.RequestException, ValueError) as e:
                last_err = e
                if attempt >= self.max_retries - 1:
                    break

                base_delay_s = 0.35 * (2**attempt)
                jitter_s = random.random() * 0.25
                time.sleep(base_delay_s + jitter_s)

        raise last_err or RuntimeError("Ollama embedding failed")

    def embed_batch(self, texts: List[str]) -> List[EmbeddingResult]:
        """Generate embeddings for multiple texts (sequential for now)."""
        return [self.embed(t) for t in texts]


class NativeEmbedder(Embedder):
    """Built-in ONNX-based embedder using nomic-embed-text-v1.5.

    Runs entirely locally — no Ollama, no cloud API, no torch.
    Model files are downloaded from HuggingFace Hub on first use and
    cached in the standard HF cache directory (~/.cache/huggingface/).

    Dependencies: onnxruntime, tokenizers, huggingface-hub.
    """

    HF_REPO_ID = "nomic-ai/nomic-embed-text-v1.5"
    ONNX_FILE = "onnx/model_quantized.onnx"
    TOKENIZER_FILE = "tokenizer.json"
    MAX_LENGTH = 8192
    DIM = 768

    def __init__(
        self,
        repo_id: str = HF_REPO_ID,
        onnx_file: str = ONNX_FILE,
        max_length: int = MAX_LENGTH,
        batch_size: int = 32,
        document_prefix: str = "search_document: ",
        query_prefix: str = "search_query: ",
    ):
        """
        Initialize the native ONNX embedder.

        Args:
            repo_id: HuggingFace repo ID for the model.
            onnx_file: Path within the repo to the ONNX model file.
            max_length: Maximum token sequence length (nomic-embed-text supports 8192).
            batch_size: Maximum texts per ONNX inference call.
            document_prefix: Prefix prepended to documents during indexing.
            query_prefix: Prefix prepended to queries during search.
        """
        self.repo_id = repo_id
        self.onnx_file = onnx_file
        self.max_length = max_length
        self.batch_size = batch_size
        self.document_prefix = document_prefix
        self.query_prefix = query_prefix
        self.model_name = f"native:{repo_id.split('/')[-1]}"

        self._session: Optional[Any] = None
        self._tokenizer: Optional[Any] = None

    # -- lazy init ---------------------------------------------------------

    def _ensure_loaded(self) -> None:
        """Download (if needed) and load ONNX model + tokenizer."""
        if self._session is not None and self._tokenizer is not None:
            return

        try:
            from huggingface_hub import hf_hub_download  # type: ignore[import-untyped]
            import onnxruntime as ort  # type: ignore[import-untyped]
            from tokenizers import Tokenizer  # type: ignore[import-untyped]
        except ImportError as e:
            raise ImportError(
                "NativeEmbedder requires: pip install onnxruntime tokenizers huggingface-hub"
            ) from e

        logger.info("Loading native embedding model %s ...", self.repo_id)

        tok_path = hf_hub_download(self.repo_id, self.TOKENIZER_FILE)
        model_path = hf_hub_download(self.repo_id, self.onnx_file)

        self._tokenizer = Tokenizer.from_file(tok_path)
        self._tokenizer.enable_truncation(max_length=self.max_length)
        self._tokenizer.enable_padding(pad_id=0, pad_token="[PAD]")

        sess_opts = ort.SessionOptions()
        sess_opts.inter_op_num_threads = 1
        sess_opts.intra_op_num_threads = 4
        sess_opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        self._session = ort.InferenceSession(
            model_path,
            sess_options=sess_opts,
            providers=["CPUExecutionProvider"],
        )

        logger.info("Native embedding model loaded (%s, dim=%d)", self.model_name, self.DIM)

    # -- core embedding ----------------------------------------------------

    def _embed_texts(self, texts: List[str]) -> "np.ndarray":
        """Embed a list of texts, returning an (N, DIM) float32 array."""
        import numpy as np  # local import keeps module-level import list light

        self._ensure_loaded()
        assert self._tokenizer is not None
        assert self._session is not None

        encodings = self._tokenizer.encode_batch(texts)

        input_ids = np.array([e.ids for e in encodings], dtype=np.int64)
        attention_mask = np.array([e.attention_mask for e in encodings], dtype=np.int64)
        token_type_ids = np.zeros_like(input_ids)

        outputs = self._session.run(
            None,
            {
                "input_ids": input_ids,
                "attention_mask": attention_mask,
                "token_type_ids": token_type_ids,
            },
        )
        hidden = outputs[0]  # (N, seq_len, 768)

        # Mean pooling over non-padding tokens
        mask_expanded = attention_mask[:, :, np.newaxis].astype(np.float32)
        summed = np.sum(hidden * mask_expanded, axis=1)
        counts = np.sum(mask_expanded, axis=1)
        mean_pooled = summed / np.maximum(counts, 1e-9)

        # L2 normalize
        norms = np.linalg.norm(mean_pooled, axis=1, keepdims=True)
        normalized = mean_pooled / np.maximum(norms, 1e-9)

        return normalized

    # -- public interface --------------------------------------------------

    def embed(self, text: str) -> EmbeddingResult:
        """Generate an embedding for a single text (document prefix applied)."""
        prefixed = self.document_prefix + text
        vec = self._embed_texts([prefixed])[0]
        return EmbeddingResult(vector=vec.tolist(), model=self.model_name)

    def embed_query(self, text: str) -> EmbeddingResult:
        """Generate an embedding for a search query (query prefix applied)."""
        prefixed = self.query_prefix + text
        vec = self._embed_texts([prefixed])[0]
        return EmbeddingResult(vector=vec.tolist(), model=self.model_name)

    def embed_batch(self, texts: List[str]) -> List[EmbeddingResult]:
        """Generate embeddings for multiple document texts (batched ONNX inference)."""
        if not texts:
            return []

        prefixed = [self.document_prefix + t for t in texts]
        results: List[EmbeddingResult] = []

        for start in range(0, len(prefixed), self.batch_size):
            chunk = prefixed[start : start + self.batch_size]
            vecs = self._embed_texts(chunk)
            for vec in vecs:
                results.append(EmbeddingResult(vector=vec.tolist(), model=self.model_name))

        return results

    def is_available(self) -> bool:
        """Check if required dependencies are installed."""
        try:
            import onnxruntime  # noqa: F401
            import tokenizers  # noqa: F401
            import huggingface_hub  # noqa: F401
            return True
        except ImportError:
            return False

    def download_model(self) -> str:
        """Pre-download the model files. Returns the path to the ONNX model."""
        from huggingface_hub import hf_hub_download  # type: ignore[import-untyped]

        hf_hub_download(self.repo_id, self.TOKENIZER_FILE)
        model_path = hf_hub_download(self.repo_id, self.onnx_file)
        return model_path


class FakeEmbedder(Embedder):
    """
    Fake embedder for testing that generates deterministic pseudo-embeddings.
    
    Does NOT require Ollama or any external service.
    """

    def __init__(self, model: str = "fake-embed", dim: int = 384):
        self.model = model
        self.dim = dim

    def embed(self, text: str) -> EmbeddingResult:
        """Generate a deterministic embedding based on text hash."""
        # Use hash of text to seed random for reproducibility
        seed = hash(text) % (2**31)
        rng = random.Random(seed)
        vector = [rng.gauss(0, 1) for _ in range(self.dim)]
        # Normalize to unit length
        norm = sum(x * x for x in vector) ** 0.5
        vector = [x / norm for x in vector]
        return EmbeddingResult(vector=vector, model=self.model)

    def embed_batch(self, texts: List[str]) -> List[EmbeddingResult]:
        return [self.embed(t) for t in texts]
