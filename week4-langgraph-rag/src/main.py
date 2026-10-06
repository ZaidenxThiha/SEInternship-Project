from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

# Allow `python src/main.py` from week4-langgraph-rag/
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import get_settings
from pipeline import RagApp
from vector_store import RetrievedChunk

HELP = """
Commands:
  /ingest          Re-load every .txt/.md file in data/ into pgvector
  /stats           Show how many chunks are stored
  /graph           Print the LangGraph structure as Mermaid
  /mode graph|chain  Switch between LangGraph and the linear LCEL chain
  /trace on|off    Show node-by-node execution for graph mode
  /help            Show this help
  /quit            Exit

Anything else is treated as a question.
""".strip()


def print_sources(sources: list[RetrievedChunk]) -> None:
    if not sources:
        return
    print("\nSources:")
    for i, item in enumerate(sources, start=1):
        preview = item.content.replace("\n", " ")
        if len(preview) > 110:
            preview = preview[:107] + "..."
        print(f"  [{i}] {item.source}#chunk{item.chunk_index} (d={item.distance:.3f}) {preview}")


def ask_graph(app: RagApp, question: str, trace: bool) -> None:
    final: dict = {}
    for update in app.graph.stream({"question": question}, stream_mode="updates"):
        for node, delta in update.items():
            final.update(delta)
            if trace:
                for step in delta.get("steps", []):
                    print(f"  · [{node}] {step}")
    print("\nAnswer:")
    print(final.get("answer") or "(no answer)")
    print_sources(final.get("relevant", []))


def ask_chain(app: RagApp, question: str) -> None:
    result = app.chain.invoke(question)
    print("\nAnswer:")
    print(result["answer"] or "(no answer)")
    print_sources(result["documents"])


def ask(app: RagApp, question: str, mode: str, trace: bool) -> None:
    started = time.perf_counter()
    if mode == "chain":
        ask_chain(app, question)
    else:
        ask_graph(app, question, trace)
    print(f"\n({mode} mode, {time.perf_counter() - started:.1f}s)\n")


def run_ingest(app: RagApp) -> None:
    stored = app.ingest()
    for name, count in stored.items():
        print(f"  {name}: {count} chunks")
    print(f"Stored {sum(stored.values())} chunks from {len(stored)} files.")


def print_banner(app: RagApp) -> None:
    s = app.settings
    print("=" * 64)
    print("Week 4 — LangGraph Agentic RAG")
    print("=" * 64)
    print(f"Provider : {s.provider_label}")
    print(f"Chat     : {app.chat.model_name}")
    print(f"Embed    : {app.embeddings.model_name}")
    print(f"Database : {s.database_url}")
    print(f"Retrieval: top_k={s.top_k} max_distance={s.max_distance} "
          f"max_attempts={s.max_retrieval_attempts}")
    print("Commands : /ingest /stats /graph /mode /trace /help /quit")
    print("=" * 64)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Week 4 LangGraph RAG demo")
    parser.add_argument("-q", "--question", help="Ask one question and exit")
    parser.add_argument("--mode", choices=["graph", "chain"], default="graph")
    parser.add_argument("--no-trace", action="store_true", help="Hide node trace")
    parser.add_argument("--ingest", action="store_true", help="Force re-ingest on start")
    parser.add_argument("--graph", action="store_true", help="Print Mermaid graph and exit")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    app = RagApp(get_settings())

    if args.graph:
        print(app.graph.get_graph().draw_mermaid())
        return 0

    mode, trace = args.mode, not args.no_trace
    print_banner(app)

    try:
        existing = app.store.count()
    except Exception as exc:  # noqa: BLE001 — setup hint on first failure
        print(f"Could not connect to Postgres/pgvector. Run `docker compose up -d`.\n{exc}")
        return 1

    if args.ingest or existing == 0:
        print("Ingesting data/ ...")
        try:
            run_ingest(app)
        except Exception as exc:  # noqa: BLE001
            print(f"Ingest failed: {exc}")
            return 1
    else:
        print(f"Knowledge base has {existing} chunks.")

    if args.question:
        ask(app, args.question, mode, trace)
        return 0

    print("\nAsk a question (or type /help).\n")
    while True:
        try:
            raw = input(f"you[{mode}]> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye.")
            return 0
        if not raw:
            continue

        command, _, arg = raw.partition(" ")
        command, arg = command.lower(), arg.strip().lower()
        try:
            if command in {"/quit", "/exit"}:
                print("Bye.")
                return 0
            if command == "/help":
                print(HELP)
            elif command == "/ingest":
                run_ingest(app)
            elif command == "/stats":
                print(f"Stored chunks: {app.store.count()}")
            elif command == "/graph":
                print(app.graph.get_graph().draw_mermaid())
            elif command == "/mode":
                if arg in {"graph", "chain"}:
                    mode = arg
                print(f"Mode: {mode}")
            elif command == "/trace":
                trace = arg != "off"
                print(f"Trace: {'on' if trace else 'off'}")
            elif command.startswith("/"):
                print("Unknown command. Type /help.")
            else:
                ask(app, raw, mode, trace)
        except Exception as exc:  # noqa: BLE001
            print(f"Error: {exc}\n")


if __name__ == "__main__":
    raise SystemExit(main())
