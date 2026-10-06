from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Literal

from state import RagState
from vector_store import RetrievedChunk

ANSWER_SYSTEM_PROMPT = """You are a helpful assistant for an internship RAG demo.
Answer ONLY using the provided context.
If the context does not contain enough information, say you don't know.
Keep answers concise (2-4 sentences).
Cite the supporting context blocks inline like [1] or [2]."""

REWRITE_SYSTEM_PROMPT = """You rewrite user questions into better search queries
for a vector database. Use the knowledge base description to expand abbreviations
into full terms and add likely keywords; remove filler. Never return the query unchanged.
Reply with the rewritten query only, on a single line, no quotes."""

FALLBACK_ANSWER = (
    "I don't know — I couldn't find relevant information in the knowledge base "
    "for that question."
)


@dataclass(frozen=True)
class RagDeps:
    embed_query: Callable[[str], list[float]]
    search: Callable[[list[float], int], list[RetrievedChunk]]
    complete: Callable[[str, str, int], str]
    top_k: int = 4
    max_distance: float = 0.5
    max_attempts: int = 2
    kb_description: str = ""


def format_context(chunks: list[RetrievedChunk]) -> str:
    return "\n\n".join(
        f"[{i}] ({chunk.source}#chunk{chunk.chunk_index})\n{chunk.content}"
        for i, chunk in enumerate(chunks, start=1)
    )


def make_nodes(deps: RagDeps) -> dict[str, Callable[[RagState], dict]]:
    def retrieve(state: RagState) -> dict:
        query = state.get("query") or state["question"]
        documents = deps.search(deps.embed_query(query), deps.top_k)
        attempts = state.get("attempts", 0) + 1
        return {
            "query": query,
            "documents": documents,
            "attempts": attempts,
            "steps": [f"retrieve#{attempts}: {len(documents)} chunks for {query!r}"],
        }

    def grade_documents(state: RagState) -> dict:
        documents = state.get("documents", [])
        relevant = [doc for doc in documents if doc.distance <= deps.max_distance]
        steps = [
            f"grade: {len(relevant)}/{len(documents)} chunks within "
            f"distance <= {deps.max_distance}"
        ]
        if documents and not relevant:
            nearest = min(doc.distance for doc in documents)
            if nearest > 0.8:
                steps.append(
                    "hint: nearest distance "
                    f"{nearest:.3f} looks like an embedding-model mismatch — "
                    "re-ingest the knowledge base (Playground: Ingest + Ask)"
                )
        return {"relevant": relevant, "steps": steps}

    def rewrite_query(state: RagState) -> dict:
        rewritten = deps.complete(
            REWRITE_SYSTEM_PROMPT,
            f"Knowledge base: {deps.kb_description or 'general documents'}\n"
            f"Original question: {state['question']}\n"
            f"Previous query (found nothing relevant): {state.get('query')}",
            60,
        ).splitlines()
        query = rewritten[0].strip() if rewritten and rewritten[0].strip() else state["question"]
        return {"query": query, "steps": [f"rewrite: {query!r}"]}

    def generate(state: RagState) -> dict:
        user_prompt = (
            f"Context:\n{format_context(state['relevant'])}\n\n"
            f"Question: {state['question']}\n\nAnswer:"
        )
        answer = deps.complete(ANSWER_SYSTEM_PROMPT, user_prompt, 300)
        return {"answer": answer, "steps": ["generate: answered from context"]}

    def fallback(state: RagState) -> dict:
        return {"answer": FALLBACK_ANSWER, "steps": ["fallback: no relevant context"]}

    return {
        "retrieve": retrieve,
        "grade_documents": grade_documents,
        "rewrite_query": rewrite_query,
        "generate": generate,
        "fallback": fallback,
    }


def make_router(deps: RagDeps) -> Callable[[RagState], Literal["generate", "rewrite_query", "fallback"]]:
    def route_after_grading(state: RagState) -> Literal["generate", "rewrite_query", "fallback"]:
        if state.get("relevant"):
            return "generate"
        if state.get("attempts", 0) < deps.max_attempts:
            return "rewrite_query"
        return "fallback"

    return route_after_grading
