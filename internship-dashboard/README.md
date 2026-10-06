# Internship Dashboard — Weeks 1–4

Local control panel to **run**, **probe**, **playground-test**, and **stream logs** for Phase 1 deliverables.

## What you get

- Tabs: **Week 1 · Week 2 · Week 3 · Week 4**
- Header: **Start all** / **Stop all** (Weeks 1–4)
- Per tab: **Status** · **Controls** · **Settings** · **Playground** · **Logs**
- Run mode toggle: **compose** (full `docker compose`) or **local** (DB via compose + `npm`/`python` where needed)
- Shared **LLM Settings** (provider, Qwen/OpenAI/Gemini keys, models) written to week2/3/4 `.env`
- Live log stream (SSE)

| Week | Start does | Playground |
|------|------------|------------|
| 1 | Compose stack or local API (`npm run dev`) + DB | Login / register / `/me` / list users |
| 2 | Compose stack or Vite (`npm run dev`) | Ping UI/API + open login/chat links |
| 3 | Bring up pgvector | Ingest / stats / ask (one-shot Python) |
| 4 | Bring up pgvector | Ask (`-q`), pytest, Mermaid graph |

## Ports

| Service | Port |
|---------|------|
| Dashboard API | **4040** |
| Dashboard UI (Vite) | **4041** |
| Week 1 API | 3000 |
| Week 1 Postgres | 5433 |
| Week 2 UI | 5173 |
| Week 3 pgvector | 5434 |
| Week 4 pgvector | 5435 |

## Quick start

```bash
cd internship-dashboard
npm install
npm run install:all
npm run dev
```

Open **http://localhost:4041**

Production-style (API serves built UI):

```bash
npm run build
npm start   # serves API + web/dist on :4040
```

## LLM Settings

Open any week tab → **Settings**.

| Field | Effect |
|-------|--------|
| Provider | `qwen` / `openai` / `gemini` / `ollama` → `LLM_PROVIDER` |
| Qwen base URL, API key, chat model | Week 2 `/qwen` proxy + week3/4 chat |
| Gemini base URL, API key, chat & embedding models | Week 2 `/gemini` proxy + week3/4 chat & embeddings |
| OpenAI base URL, API key, chat & embedding models | Week 2 `/openai` proxy + week3/4 when provider is `openai` |
| Ollama base URL, chat & embedding models | Local embeddings / fallback |

Saving upserts the same values into:

- `week2-react-app/.env` (`QWEN_*`, `VITE_QWEN_CHAT_MODEL` — never a `VITE_*` secret)
- `week3-rag-demo/.env`
- `week4-langgraph-rag/.env`

API: `GET/PUT /api/llm-settings` (keys are masked on GET). Week 3/4 playground asks pick up new env immediately. **After changing Qwen settings, Stop + Start Week 2** so Vite reloads the proxy.

## Notes

- Week 2 **local** expects the Week 1 API already running on `:3000`.
- Week 2 chat talks to self-hosted Qwen via the Vite `/qwen` proxy (set the key in Settings).
- Weeks 3–4 need their `.venv` installed (`pip install -r requirements.txt`) and usually Ollama for embeddings.
- Stop a week before switching compose ↔ local.
- This dashboard shells out to `docker`, `npm`, and each week’s Python venv — keep those on your `PATH`.
- Dashboard has no auth — keep it on localhost only when API keys are configured.
