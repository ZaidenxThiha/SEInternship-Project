from __future__ import annotations

from pathlib import Path

from chain_baseline import build_chain
from chunking import chunk_text
from config import Settings
from embeddings import EmbeddingClient
from graph import build_graph
from llm import ChatClient
from nodes import RagDeps
from vector_store import VectorStore

DOC_SUFFIXES = {".txt", ".md"}


class RagApp:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.embeddings = EmbeddingClient(settings)
        self.chat = ChatClient(settings)
        self.store = VectorStore(settings)
        self.deps = RagDeps(
            embed_query=self.embeddings.embed_one,
            search=self.store.similarity_search,
            complete=lambda system, user, max_tokens: self.chat.complete(
                system, user, max_tokens=max_tokens
            ),
            top_k=settings.top_k,
            max_distance=settings.max_distance,
            max_attempts=settings.max_retrieval_attempts,
            kb_description=settings.kb_description,
        )
        self.graph = build_graph(self.deps)
        self.chain = build_chain(self.deps)

    def documents(self) -> list[Path]:
        return sorted(
            p for p in self.settings.data_dir.iterdir() if p.suffix in DOC_SUFFIXES
        )

    def ingest(self) -> dict[str, int]:
        stored: dict[str, int] = {}
        for path in self.documents():
            chunks = chunk_text(
                path.read_text(encoding="utf-8"),
                chunk_size=self.settings.chunk_size,
                overlap=self.settings.chunk_overlap,
            )
            if not chunks:
                continue
            vectors = self.embeddings.embed(chunks)
            stored[path.name] = self.store.replace_source(path.name, chunks, vectors)
        return stored
