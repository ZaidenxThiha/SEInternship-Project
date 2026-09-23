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
        self._dim: int | None = None

    def connect(self) -> psycopg.Connection:
        return psycopg.connect(self.settings.database_url, row_factory=dict_row)

    def init_schema(self, embedding_dim: int) -> None:
        # pgvector type modifiers must be literals, not bind parameters.
        dim = int(embedding_dim)
        if dim <= 0:
            raise ValueError("embedding_dim must be a positive integer")
        self._dim = dim
        with self.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                cur.execute(
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
                # HNSW works on empty tables; better default for small demos than IVFFlat.
                cur.execute(
                    """
                    CREATE INDEX IF NOT EXISTS documents_embedding_cosine_idx
                    ON documents
                    USING hnsw (embedding vector_cosine_ops);
                    """
                )
            conn.commit()

    def clear_source(self, source: str) -> None:
        with self.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM documents WHERE source = %s;", (source,))
            conn.commit()

    def upsert_chunks(
        self,
        source: str,
        chunks: list[str],
        embeddings: list[list[float]],
    ) -> int:
        if len(chunks) != len(embeddings):
            raise ValueError("chunks and embeddings length mismatch")
        if not embeddings:
            return 0

        dim = len(embeddings[0])
        if self._dim is None:
            self.init_schema(dim)
        elif self._dim != dim:
            raise ValueError(
                f"Embedding dim changed ({self._dim} -> {dim}). "
                "Drop the documents table or use a fresh database."
            )

        self.clear_source(source)

        with self.connect() as conn:
            with conn.cursor() as cur:
                for index, (content, vector) in enumerate(zip(chunks, embeddings)):
                    cur.execute(
                        """
                        INSERT INTO documents (source, chunk_index, content, embedding)
                        VALUES (%s, %s, %s, %s::vector)
                        """,
                        (source, index, content, _vector_literal(vector)),
                    )
            conn.commit()
        return len(chunks)

    def similarity_search(
        self, query_embedding: list[float], top_k: int
    ) -> list[RetrievedChunk]:
        with self.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        id,
                        source,
                        chunk_index,
                        content,
                        (embedding <=> %s::vector) AS distance
                    FROM documents
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                    """,
                    (
                        _vector_literal(query_embedding),
                        _vector_literal(query_embedding),
                        top_k,
                    ),
                )
                rows = cur.fetchall()

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
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                          AND table_name = 'documents'
                    ) AS present;
                    """
                )
                row = cur.fetchone()
                if not row or not row["present"]:
                    return 0
                cur.execute("SELECT COUNT(*) AS c FROM documents;")
                count_row = cur.fetchone()
                return int(count_row["c"]) if count_row else 0
