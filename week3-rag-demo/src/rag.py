from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from chunking import chunk_text
from config import Settings
from embeddings import EmbeddingClient
from llm import ChatClient
from vector_store import RetrievedChunk, VectorStore

SYSTEM_PROMPT = """You are a helpful assistant for an AI engineering internship demo.
Answer ONLY using the provided context.
If the context does not contain enough information, say you don't know.
Keep answers concise and clear.
When useful, mention which source chunk numbers support your answer."""


@dataclass(frozen=True)
class RagAnswer:
    question: str
    answer: str
    reasoning: str
    sources: list[RetrievedChunk]


class RagPipeline:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.embeddings = EmbeddingClient(settings)
        self.chat = ChatClient(settings)
        self.store = VectorStore(settings)

    def ingest_file(self, path: Path) -> int:
        text = path.read_text(encoding="utf-8")
        chunks = chunk_text(
            text,
            chunk_size=self.settings.chunk_size,
            overlap=self.settings.chunk_overlap,
        )
        if not chunks:
            raise ValueError(f"No chunks produced from {path}")

        vectors = self.embeddings.embed(chunks)
        self.store.init_schema(len(vectors[0]))
        return self.store.upsert_chunks(
            source=path.name,
            chunks=chunks,
            embeddings=vectors,
        )

    def ask(self, question: str) -> RagAnswer:
        query_vec = self.embeddings.embed_one(question)
        sources = self.store.similarity_search(query_vec, self.settings.top_k)
        if not sources:
            return RagAnswer(
                question=question,
                answer="I don't know — the knowledge base is empty. Run ingest first.",
                reasoning="",
                sources=[],
            )

        context = "\n\n".join(
            f"[chunk {item.chunk_index} | {item.source} | distance={item.distance:.4f}]\n"
            f"{item.content}"
            for item in sources
        )
        user_prompt = (
            f"Context:\n{context}\n\n"
            f"Question: {question}\n\n"
            "Answer:"
        )
        reply = self.chat.complete(SYSTEM_PROMPT, user_prompt)
        return RagAnswer(
            question=question,
            answer=reply.content,
            reasoning=reply.reasoning,
            sources=sources,
        )
