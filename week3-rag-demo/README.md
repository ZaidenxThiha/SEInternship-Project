# Week 3 — AI Foundations: LLM & Basic RAG

Internship Phase 1 / Week 3 deliverable: a Python RAG demo that reads a text file, chunks it, embeds vectors into **PostgreSQL + pgvector**, retrieves top matches, and answers questions in an interactive REPL.

OpenAI is used when `OPENAI_API_KEY` is set; otherwise the demo falls back to **Ollama**.

## Stack

- Python 3.11+
- OpenAI API (`gpt-4o-mini` + `text-embedding-3-small`) or Ollama
- PostgreSQL 16 + [pgvector](https://github.com/pgvector/pgvector)
- Docker Compose for the database

## Quick start

### 1. Start pgvector

```bash
docker compose up -d
```

Postgres is mapped to host port **5434** (avoids conflict with Week 1 on 5433).

### 2. Configure env

```bash
cp .env.example .env
# Optional: put your OpenAI key in .env
# OPENAI_API_KEY=sk-...
```

### 3. Create a Python 3.12 venv and install deps

Do **not** use plain `python3` on this machine if it is broken; use `python3.12`:

```bash
cd week3-rag-demo
rm -rf .venv
python3.12 -m venv .venv
source .venv/bin/activate
python -V          # should print Python 3.12.x
pip install -r requirements.txt
```

### 4. Run the interactive demo

```bash
python src/main.py
```

On first run the CLI ingests `data/sample.txt`, then opens a question loop:

```text
you> What is RAG?
you> What is pgvector?
you> /stats
you> /quit
```

## Ollama fallback (no OpenAI key)

1. Install and start [Ollama](https://ollama.com).
2. Pull models:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

3. Leave `OPENAI_API_KEY` empty (or set `LLM_PROVIDER=ollama`) and run `python src/main.py`.

## Project structure

```text
week3-rag-demo/
  data/sample.txt       # knowledge document
  docker-compose.yml    # Postgres + pgvector
  src/
    main.py             # interactive CLI
    config.py           # env / provider selection
    chunking.py         # overlapping text chunks
    embeddings.py       # OpenAI or Ollama embeddings
    vector_store.py     # pgvector upsert + similarity search
    llm.py              # OpenAI or Ollama chat
    rag.py              # retrieve → prompt → answer
```

## CLI commands

| Command   | Action                                      |
|-----------|---------------------------------------------|
| (text)    | Ask a question against the knowledge base   |
| `/ingest` | Re-load `data/sample.txt` into pgvector     |
| `/stats`  | Show stored chunk count                     |
| `/help`   | Show help                                   |
| `/quit`   | Exit                                        |

## Learning checklist (Week 3)

- [ ] Explain LLM + basic prompt engineering
- [ ] Explain RAG: embedding → vector DB → retrieval → generation
- [ ] Call OpenAI (or Ollama) from Python
- [ ] Store and query vectors with pgvector
- [ ] Demo: ask a question about `data/sample.txt` and show sources
