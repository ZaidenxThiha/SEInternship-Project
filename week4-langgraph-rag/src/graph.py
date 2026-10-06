from __future__ import annotations

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from nodes import RagDeps, make_nodes, make_router
from state import RagState


def build_graph(deps: RagDeps) -> CompiledStateGraph:
    """
    START -> retrieve -> grade_documents --(relevant)--> generate -> END
                  ^              |
                  |              +--(none, retries left)--> rewrite_query
                  |                                              |
                  +----------------------------------------------+
                                 |
                                 +--(none, out of retries)--> fallback -> END
    """
    nodes = make_nodes(deps)
    builder = StateGraph(RagState)
    for name, fn in nodes.items():
        builder.add_node(name, fn)

    builder.add_edge(START, "retrieve")
    builder.add_edge("retrieve", "grade_documents")
    builder.add_conditional_edges(
        "grade_documents",
        make_router(deps),
        ["generate", "rewrite_query", "fallback"],
    )
    builder.add_edge("rewrite_query", "retrieve")
    builder.add_edge("generate", END)
    builder.add_edge("fallback", END)
    return builder.compile()
