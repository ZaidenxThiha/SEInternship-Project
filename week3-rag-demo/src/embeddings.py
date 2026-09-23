from __future__ import annotations

import httpx
from openai import OpenAI

from config import Settings


class EmbeddingClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._openai: OpenAI | None = None
        if settings.use_openai:
            self._openai = OpenAI(api_key=settings.openai_api_key)

    @property
    def model_name(self) -> str:
        if self.settings.use_openai:
            return self.settings.openai_embedding_model
        return self.settings.ollama_embedding_model

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if self.settings.use_openai:
            return self._embed_openai(texts)
        return self._embed_ollama(texts)

    def embed_one(self, text: str) -> list[float]:
        return self.embed([text])[0]

    def _embed_openai(self, texts: list[str]) -> list[list[float]]:
        assert self._openai is not None
        response = self._openai.embeddings.create(
            model=self.settings.openai_embedding_model,
            input=texts,
        )
        # API may return items out of order; sort by index.
        ordered = sorted(response.data, key=lambda item: item.index)
        return [item.embedding for item in ordered]

    def _embed_ollama(self, texts: list[str]) -> list[list[float]]:
        """Prefer /api/embed (batch); fall back to legacy /api/embeddings."""
        with httpx.Client(timeout=120.0) as client:
            embed_url = f"{self.settings.ollama_base_url}/api/embed"
            response = client.post(
                embed_url,
                json={
                    "model": self.settings.ollama_embedding_model,
                    "input": texts,
                },
            )
            if response.status_code == 200:
                payload = response.json()
                embeddings = payload.get("embeddings")
                if embeddings and len(embeddings) == len(texts):
                    return embeddings

            vectors: list[list[float]] = []
            legacy_url = f"{self.settings.ollama_base_url}/api/embeddings"
            for text in texts:
                legacy = client.post(
                    legacy_url,
                    json={
                        "model": self.settings.ollama_embedding_model,
                        "prompt": text,
                    },
                )
                legacy.raise_for_status()
                payload = legacy.json()
                embedding = payload.get("embedding")
                if not embedding:
                    raise RuntimeError(
                        "Ollama embedding response missing 'embedding'. "
                        f"Is model '{self.settings.ollama_embedding_model}' pulled?"
                    )
                vectors.append(embedding)
            return vectors
