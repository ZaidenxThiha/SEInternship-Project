from __future__ import annotations

import sys
from pathlib import Path

# Allow `python src/main.py` from week3-rag-demo/
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import get_settings
from rag import RagPipeline


def print_banner(pipeline: RagPipeline) -> None:
    settings = pipeline.settings
    print("=" * 60)
    print("Week 3 — AI Foundations: LLM & Basic RAG")
    print("=" * 60)
    print(f"Provider : {settings.provider_label}")
    print(f"Chat     : {pipeline.chat.model_name}")
    print(f"Embed    : {pipeline.embeddings.model_name}")
    print(f"Database : {settings.database_url}")
    print("Commands : /ingest  /stats  /help  /quit")
    print("=" * 60)


def run_ingest(pipeline: RagPipeline) -> None:
    path = pipeline.settings.sample_doc
    if not path.exists():
        print(f"Sample document not found: {path}")
        return
    print(f"Ingesting {path} ...")
    count = pipeline.ingest_file(path)
    print(f"Stored {count} chunks from '{path.name}'.")


def print_help() -> None:
    print(
        """
Commands:
  /ingest   Re-load data/sample.txt into pgvector
  /stats    Show how many chunks are stored
  /help     Show this help
  /quit     Exit the REPL

Anything else is treated as a question against the knowledge base.
""".strip()
    )


def print_answer(answer_text: str, sources, reasoning: str = "") -> None:
    if reasoning:
        print("\nReasoning:")
        print(reasoning)
    print("\nAnswer:")
    print(answer_text or "(no final answer)")
    if sources:
        print("\nSources:")
        for item in sources:
            preview = item.content.replace("\n", " ")
            if len(preview) > 140:
                preview = preview[:137] + "..."
            print(
                f"  - chunk {item.chunk_index} "
                f"(distance={item.distance:.4f}): {preview}"
            )
    print()


def main() -> int:
    settings = get_settings()
    pipeline = RagPipeline(settings)
    print_banner(pipeline)

    if settings.llm_provider == "qwen":
        print(
            "Chat is using the VPS Qwen API.\n"
            f"  {settings.qwen_base_url}  model={settings.qwen_chat_model}\n"
            "Embeddings still use local Ollama "
            f"({settings.ollama_embedding_model}).\n"
        )
    elif not settings.use_openai:
        print(
            "No OPENAI_API_KEY detected (or LLM_PROVIDER=ollama). "
            "Using Ollama fallback.\n"
            "Make sure Ollama is running and models are pulled, e.g.:\n"
            f"  ollama pull {settings.ollama_chat_model}\n"
            f"  ollama pull {settings.ollama_embedding_model}\n"
        )

    # Auto-ingest on first run if the table is empty / unreachable.
    try:
        existing = pipeline.store.count()
    except Exception as exc:  # noqa: BLE001 — show setup hint on first failure
        print(
            "Could not connect to Postgres/pgvector.\n"
            "Start it with:\n"
            "  docker compose up -d\n"
            f"Details: {exc}"
        )
        return 1

    if existing == 0:
        print("Knowledge base is empty — running initial ingest...\n")
        try:
            run_ingest(pipeline)
        except Exception as exc:  # noqa: BLE001
            print(f"Ingest failed: {exc}")
            return 1
    else:
        print(f"Knowledge base already has {existing} chunks.\n")

    print("Ask a question (or type /help).\n")

    while True:
        try:
            raw = input("you> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye.")
            return 0

        if not raw:
            continue

        command = raw.lower()
        if command in {"/quit", "/exit", "quit", "exit"}:
            print("Bye.")
            return 0
        if command == "/help":
            print_help()
            continue
        if command == "/ingest":
            try:
                run_ingest(pipeline)
            except Exception as exc:  # noqa: BLE001
                print(f"Ingest failed: {exc}")
            continue
        if command == "/stats":
            try:
                print(f"Stored chunks: {pipeline.store.count()}")
            except Exception as exc:  # noqa: BLE001
                print(f"Stats failed: {exc}")
            continue

        try:
            result = pipeline.ask(raw)
            print_answer(result.answer, result.sources, result.reasoning)
        except Exception as exc:  # noqa: BLE001
            print(f"Ask failed: {exc}\n")


if __name__ == "__main__":
    raise SystemExit(main())
