from __future__ import annotations

from chain_baseline import build_chain
from graph import build_graph
from nodes import FALLBACK_ANSWER, REWRITE_SYSTEM_PROMPT, RagDeps
from vector_store import RetrievedChunk


def chunk(distance: float, content: str = "LangGraph uses nodes and edges.") -> RetrievedChunk:
    return RetrievedChunk(id=1, content=content, source="notes.md", chunk_index=0, distance=distance)


class FakeBackend:
    """Returns search results keyed by query and records every LLM call."""

    def __init__(self, results_by_query: dict[str, list[RetrievedChunk]], rewrite_to: str = "rewritten"):
        self.results_by_query = results_by_query
        self.rewrite_to = rewrite_to
        self.queries: list[str] = []
        self.llm_calls: list[str] = []

    def deps(self, max_attempts: int = 2) -> RagDeps:
        return RagDeps(
            embed_query=self._embed,
            search=self._search,
            complete=self._complete,
            top_k=3,
            max_distance=0.5,
            max_attempts=max_attempts,
        )

    def _embed(self, text: str) -> list[float]:
        self.queries.append(text)
        return [float(len(text))]

    def _search(self, vector: list[float], top_k: int) -> list[RetrievedChunk]:
        return self.results_by_query.get(self.queries[-1], [])[:top_k]

    def _complete(self, system: str, user: str, max_tokens: int) -> str:
        if system == REWRITE_SYSTEM_PROMPT:
            self.llm_calls.append("rewrite")
            return self.rewrite_to
        self.llm_calls.append("generate")
        return "LangGraph models workflows as graphs [1]."


def run(backend: FakeBackend, question: str, max_attempts: int = 2) -> dict:
    return build_graph(backend.deps(max_attempts)).invoke({"question": question})


def test_relevant_docs_go_straight_to_generate():
    backend = FakeBackend({"what is langgraph": [chunk(0.2), chunk(0.9)]})
    result = run(backend, "what is langgraph")

    assert result["answer"].startswith("LangGraph models")
    assert result["attempts"] == 1
    assert len(result["relevant"]) == 1
    assert backend.llm_calls == ["generate"]
    assert [s.split(":")[0] for s in result["steps"]] == ["retrieve#1", "grade", "generate"]


def test_irrelevant_docs_trigger_rewrite_then_generate():
    backend = FakeBackend(
        {"lg?": [chunk(0.8)], "rewritten": [chunk(0.3)]},
        rewrite_to="rewritten",
    )
    result = run(backend, "lg?")

    assert backend.queries == ["lg?", "rewritten"]
    assert backend.llm_calls == ["rewrite", "generate"]
    assert result["attempts"] == 2
    assert result["query"] == "rewritten"
    assert "generate: answered from context" in result["steps"]


def test_falls_back_after_max_attempts():
    backend = FakeBackend({}, rewrite_to="still nothing")
    result = run(backend, "weather in Hanoi?", max_attempts=2)

    assert result["answer"] == FALLBACK_ANSWER
    assert result["attempts"] == 2
    assert backend.llm_calls == ["rewrite"]
    assert result["steps"][-1].startswith("fallback")


def test_single_attempt_skips_rewrite():
    backend = FakeBackend({})
    result = run(backend, "anything", max_attempts=1)

    assert result["answer"] == FALLBACK_ANSWER
    assert backend.llm_calls == []


def test_graph_structure_has_expected_nodes_and_loop():
    graph = build_graph(FakeBackend({}).deps()).get_graph()
    assert {"retrieve", "grade_documents", "rewrite_query", "generate", "fallback"} <= set(graph.nodes)
    edges = {(e.source, e.target) for e in graph.edges}
    assert ("rewrite_query", "retrieve") in edges
    assert ("grade_documents", "fallback") in edges


def test_lcel_chain_always_generates_even_without_relevant_docs():
    backend = FakeBackend({})
    deps = backend.deps()
    result = build_chain(deps).invoke("weather in Hanoi?")

    assert result["documents"] == []
    assert backend.llm_calls == ["generate"]
