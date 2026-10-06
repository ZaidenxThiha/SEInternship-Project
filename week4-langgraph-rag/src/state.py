from __future__ import annotations

import operator
from typing import Annotated, TypedDict

from vector_store import RetrievedChunk


class RagState(TypedDict, total=False):
    """Shared state passed between graph nodes.

    Each node returns a partial dict; LangGraph merges it into the state.
    Keys without a reducer are overwritten, `steps` is appended via `operator.add`.
    """

    question: str
    query: str
    attempts: int
    documents: list[RetrievedChunk]
    relevant: list[RetrievedChunk]
    answer: str
    steps: Annotated[list[str], operator.add]
