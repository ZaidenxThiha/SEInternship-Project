# Week 4 Knowledge Base — LangGraph & Agentic Workflows

## What is LangGraph?
LangGraph is a library from the LangChain team for building stateful, multi-step
LLM applications as graphs. Instead of a fixed sequence of calls, you describe the
workflow as nodes connected by edges, and LangGraph runs the graph while carrying a
shared state object from node to node. It supports loops, branching, retries,
checkpointing (persistence), streaming, and human-in-the-loop interruptions.

## State
The state is a typed dictionary (usually a Python TypedDict) shared by every node.
Each node receives the current state and returns a partial update. By default an
update overwrites the key; a reducer such as operator.add can be attached with
Annotated to append instead, which is useful for message history or execution traces.

## Nodes
A node is a plain Python function (or runnable) that takes the state and returns
updates. In a RAG graph typical nodes are: retrieve (vector search), grade_documents
(check relevance), rewrite_query (improve the search query), generate (call the LLM
with context), and fallback (answer "I don't know").

## Edges
Normal edges always go from one node to the next, for example retrieve to
grade_documents. Conditional edges call a routing function that inspects the state
and returns the name of the next node. START and END are special nodes marking the
entry and exit of the graph. Conditional edges that point backwards create loops,
such as rewrite_query going back to retrieve.

## Agentic workflow
An agentic workflow lets the system make decisions during execution instead of
always following the same path. In agentic RAG the pipeline can decide that the
retrieved documents are not relevant, rewrite the question, search again, and stop
after a maximum number of attempts. This self-correction is what separates agentic
RAG from a basic linear RAG chain.

## LangGraph vs traditional LangChain
Traditional LangChain chains (LCEL, the pipe operator) are directed acyclic
pipelines: prompt, then model, then output parser, executed once in order. They are
simple and great for linear flows but awkward for loops, conditional branching, and
long-running state. LangGraph models the flow as a state machine, so cycles,
branches, retries, and persistence are first-class. LangGraph still reuses LangChain
components (models, retrievers, runnables) inside its nodes, so the two are
complementary: LCEL for simple steps, LangGraph for orchestration.

## Compiling and running a graph
You build a graph with StateGraph(State), add nodes with add_node, connect them with
add_edge and add_conditional_edges, then call compile(). The compiled graph exposes
invoke for a single result and stream for step-by-step updates, which is useful for
tracing which node ran and what it changed. get_graph().draw_mermaid() renders the
structure as a Mermaid diagram.

## Phase 1 recap
Week 1 built a Node.js + TypeScript + Prisma REST API with JWT auth and Docker.
Week 2 built a React + Tailwind + shadcn/ui frontend with role-protected routes and a
static chat UI. Week 3 built a Python RAG script with pgvector embeddings. Week 4
rebuilds that RAG pipeline on LangGraph with a relevance check and query rewriting.
Hybrid search and reranking are intentionally left for Week 9.
