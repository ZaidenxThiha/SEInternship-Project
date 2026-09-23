from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


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
    ollama_base_url: str
    ollama_chat_model: str
    ollama_embedding_model: str
    chunk_size: int
    chunk_overlap: int
    top_k: int
    sample_doc: Path

    @property
    def use_openai(self) -> bool:
        if self.llm_provider in {"ollama", "qwen"}:
            return False
        return bool(self.openai_api_key)

    @property
    def provider_label(self) -> str:
        if self.llm_provider == "qwen":
            return "qwen"
        return "openai" if self.use_openai else "ollama"


def get_settings() -> Settings:
    return Settings(
        database_url=os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5434/week3_rag",
        ),
        llm_provider=os.getenv("LLM_PROVIDER", "qwen").strip().lower(),
        openai_api_key=os.getenv("OPENAI_API_KEY") or None,
        openai_base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/"),
        openai_chat_model=os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
        qwen_base_url=os.getenv(
            "QWEN_BASE_URL", "https://203.55.176.215.sslip.io/v1"
        ).rstrip("/"),
        qwen_api_key=os.getenv("QWEN_API_KEY", ""),
        qwen_chat_model=os.getenv("QWEN_CHAT_MODEL", "qwen3-chat"),
        openai_embedding_model=os.getenv(
            "OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"
        ),
        ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip(
            "/"
        ),
        ollama_chat_model=os.getenv("OLLAMA_CHAT_MODEL", "llama3.2"),
        ollama_embedding_model=os.getenv(
            "OLLAMA_EMBEDDING_MODEL", "nomic-embed-text"
        ),
        chunk_size=int(os.getenv("CHUNK_SIZE", "500")),
        chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "80")),
        top_k=int(os.getenv("TOP_K", "3")),
        sample_doc=ROOT / "data" / "sample.txt",
    )
