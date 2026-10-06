"""Traditional LangChain (LCEL) version of the same RAG flow, for comparison.

An LCEL chain is a linear pipe: retrieve -> prompt -> LLM. It cannot loop back
to retry retrieval or branch to a fallback without leaving the chain abstraction,
which is exactly what the LangGraph version adds.
"""

from __future__ import annotations

from langchain_core.runnables import Runnable, RunnableLambda, RunnablePassthrough

from nodes import ANSWER_SYSTEM_PROMPT, RagDeps, format_context


def build_chain(deps: RagDeps) -> Runnable:
    retrieve = RunnableLambda(
        lambda question: deps.search(deps.embed_query(question), deps.top_k)
    )
    answer = RunnableLambda(
        lambda inputs: deps.complete(
            ANSWER_SYSTEM_PROMPT,
            f"Context:\n{format_context(inputs['documents'])}\n\n"
            f"Question: {inputs['question']}\n\nAnswer:",
            300,
        )
    )
    return (
        {"question": RunnablePassthrough(), "documents": retrieve}
        | RunnablePassthrough.assign(answer=answer)
    )
