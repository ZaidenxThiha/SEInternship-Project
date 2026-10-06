from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


def _normalize_openai_compat_base(url: str) -> str:
    """Ensure OpenAI-compatible bases end with /v1 (not a website origin)."""
    trimmed = (url or "").strip().rstrip("/")
    if not trimmed:
        return "https://203.55.176.215.sslip.io/v1"
    if trimmed.endswith("/v1"):
        return trimmed
    return f"{trimmed}/v1"


@dataclass(frozen=True)
class Settings:
    database_url: str
    llm_provider: str
    openai_api_key: str | None
    openai_base_url: str
    openai_chat_model: str
    openai_embedding_model: str
    qwen_base_url: str
    qwen_api_key: str
    qwen_chat_model: str
    gemini_base_url: str
    gemini_api_key: str
    gemini_chat_model: str
    gemini_embedding_model: str
    gemini_embedding_dimensions: int
    ollama_base_url: str
    ollama_chat_model: str
    ollama_embedding_model: str
    chunk_size: int
    chunk_overlap: int
    top_k: int
    max_distance: float
    max_retrieval_attempts: int
    kb_description: str
    data_dir: Path

    @property
    def use_openai(self) -> bool:
        if self.llm_provider in {"ollama", "qwen", "gemini"}:
            return False
        return bool(self.openai_api_key)

    @property
    def use_gemini(self) -> bool:
        return self.llm_provider == "gemini"

    @property
    def provider_label(self) -> str:
        if self.llm_provider in {"qwen", "gemini", "ollama"}:
            return self.llm_provider
        return "openai" if self.use_openai else "ollama"


def get_settings() -> Settings:
    return Settings(
        database_url=os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5435/week4_rag",
        ),
        llm_provider=os.getenv("LLM_PROVIDER", "qwen").strip().lower(),
        openai_api_key=os.getenv("OPENAI_API_KEY") or None,
        openai_base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/"),
        openai_chat_model=os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
        openai_embedding_model=os.getenv(
            "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"
        ),
        qwen_base_url=_normalize_openai_compat_base(
            os.getenv("QWEN_BASE_URL", "https://203.55.176.215.sslip.io/v1")
        ),
        qwen_api_key=os.getenv("QWEN_API_KEY", ""),
        qwen_chat_model=os.getenv("QWEN_CHAT_MODEL", "qwen3-chat"),
        gemini_base_url=os.getenv(
            "GEMINI_BASE_URL",
            "https://generativelanguage.googleapis.com/v1beta/openai",
        ).rstrip("/"),
        gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
        gemini_chat_model=os.getenv("GEMINI_CHAT_MODEL", "gemini-3.5-flash-lite"),
        gemini_embedding_model=os.getenv(
            "GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"
        ),
        # Match nomic-embed-text (768) so switching qwen↔gemini doesn't break pgvector.
        gemini_embedding_dimensions=int(os.getenv("GEMINI_EMBEDDING_DIMENSIONS", "768")),
        ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/"),
        ollama_chat_model=os.getenv("OLLAMA_CHAT_MODEL", "llama3.2"),
        ollama_embedding_model=os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text"),
        chunk_size=int(os.getenv("CHUNK_SIZE", "500")),
        chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "80")),
        top_k=int(os.getenv("TOP_K", "4")),
        max_distance=float(os.getenv("MAX_DISTANCE", "0.5")),
        max_retrieval_attempts=int(os.getenv("MAX_RETRIEVAL_ATTEMPTS", "2")),
        kb_description=os.getenv(
            "KB_DESCRIPTION",
            "AI engineering notes: RAG, embeddings, pgvector, prompt engineering, "
            "LangGraph (LG), LangChain Expression Language (LCEL), agentic workflows, "
            "and the internship Phase 1 recap.",
        ),
        data_dir=ROOT / "data",
    )
