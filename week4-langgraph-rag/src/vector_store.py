from __future__ import annotations

from dataclasses import dataclass

import psycopg
from psycopg.rows import dict_row

from config import Settings


@dataclass(frozen=True)
class RetrievedChunk:
    id: int
    content: str
    source: str
    chunk_index: int
    distance: float


def _vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in values) + "]"


class VectorStore:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def connect(self) -> psycopg.Connection:
        return psycopg.connect(self.settings.database_url, row_factory=dict_row)

    def init_schema(self, embedding_dim: int) -> None:
        # pgvector type modifiers must be literals, not bind parameters.
        dim = int(embedding_dim)
        if dim <= 0:
            raise ValueError("embedding_dim must be a positive integer")
        with self.connect() as conn:
            conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            conn.execute(
                f"""
                CREATE TABLE IF NOT EXISTS documents (
                    id BIGSERIAL PRIMARY KEY,
                    source TEXT NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    embedding vector({dim}) NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (source, chunk_index)
                );
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS documents_embedding_cosine_idx
                ON documents USING hnsw (embedding vector_cosine_ops);
                """
            )

    def replace_source(
        self,
        source: str,
        chunks: list[str],
        embeddings: list[list[float]],
    ) -> int:
        if len(chunks) != len(embeddings):
            raise ValueError("chunks and embeddings length mismatch")
        if not embeddings:
            return 0
        self.init_schema(len(embeddings[0]))
        with self.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM documents WHERE source = %s;", (source,))
                cur.executemany(
                    """
                    INSERT INTO documents (source, chunk_index, content, embedding)
                    VALUES (%s, %s, %s, %s::vector)
                    """,
                    [
                        (source, index, content, _vector_literal(vector))
                        for index, (content, vector) in enumerate(zip(chunks, embeddings))
                    ],
                )
        return len(chunks)

    def similarity_search(self, query_embedding: list[float], top_k: int) -> list[RetrievedChunk]:
        vector = _vector_literal(query_embedding)
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT id, source, chunk_index, content,
                       (embedding <=> %s::vector) AS distance
                FROM documents
                ORDER BY embedding <=> %s::vector
                LIMIT %s;
                """,
                (vector, vector, top_k),
            ).fetchall()
        return [
            RetrievedChunk(
                id=row["id"],
                content=row["content"],
                source=row["source"],
                chunk_index=row["chunk_index"],
                distance=float(row["distance"]),
            )
            for row in rows
        ]

    def count(self) -> int:
        with self.connect() as conn:
            present = conn.execute("SELECT to_regclass('public.documents') IS NOT NULL AS present;").fetchone()
            if not present or not present["present"]:
                return 0
            row = conn.execute("SELECT COUNT(*) AS c FROM documents;").fetchone()
            return int(row["c"]) if row else 0
