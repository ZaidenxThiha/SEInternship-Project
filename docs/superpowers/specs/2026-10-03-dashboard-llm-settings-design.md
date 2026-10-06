# Design: Shared LLM Settings on Internship Dashboard

**Date:** 2026-10-03  
**Status:** Approved and implemented  
**Approach:** A — dashboard writes shared values into week2/3/4 `.env` files

## Goal

Let the internship dashboard configure one shared LLM setup for Weeks 2–4:

- Provider (`qwen` | `openai` | `ollama`)
- Qwen API key, base URL, chat model
- OpenAI API key, base URL, chat model, embedding model
- Ollama base URL, chat model, embedding model (optional but included for completeness)

Also update READMEs so Week 2 documents live Qwen chat (not “static / no AI”).

## Non-goals

- Per-week overrides
- Dashboard authentication
- Fetching live model lists from the VPS / OpenAI
- Proxying all LLM traffic through the dashboard

## Architecture

```
Dashboard UI (Settings)
    │ PUT /api/llm-settings
    ▼
Dashboard server (llmSettings.ts)
    │ upsert keys (never log secrets)
    ├─► week2-react-app/.env
    ├─► week3-rag-demo/.env
    └─► week4-langgraph-rag/.env
         │
         ├─ Week 2 Vite (restart required) → /qwen proxy injects QWEN_API_KEY
         └─ Week 3/4 Python (dotenv + playground env merge) → immediate effect
```

## API

### `GET /api/llm-settings`

Returns current settings. Secrets are masked:

```json
{
  "provider": "qwen",
  "qwen": {
    "baseUrl": "https://….sslip.io/v1",
    "chatModel": "qwen3-chat",
    "apiKeySet": true,
    "apiKeyHint": "••••abcd"
  },
  "openai": {
    "baseUrl": "https://api.openai.com/v1",
    "chatModel": "gpt-4o-mini",
    "embeddingModel": "text-embedding-3-small",
    "apiKeySet": false,
    "apiKeyHint": null
  },
  "ollama": {
    "baseUrl": "http://localhost:11434",
    "chatModel": "llama3.2",
    "embeddingModel": "nomic-embed-text"
  },
  "restartHint": "Stop and Start Week 2 after changing Qwen key/URL/model so Vite reloads the proxy."
}
```

### `PUT /api/llm-settings`

Body accepts partial updates. Empty string for an API key means “leave unchanged”. Explicit clear is supported via `"clearQwenApiKey": true` / `"clearOpenaiApiKey": true`.

Writes the same logical values into all three week `.env` files (upsert known keys only; preserve unrelated keys).

## Env keys written

| Key | Weeks |
|-----|--------|
| `LLM_PROVIDER` | 3, 4 (week2 ignores; always Qwen proxy) |
| `QWEN_BASE_URL` | 2, 3, 4 |
| `QWEN_API_KEY` | 2, 3, 4 |
| `QWEN_CHAT_MODEL` | 2, 3, 4 |
| `OPENAI_BASE_URL` | 3, 4 |
| `OPENAI_API_KEY` | 3, 4 |
| `OPENAI_CHAT_MODEL` | 3, 4 |
| `OPENAI_EMBEDDING_MODEL` | 3, 4 |
| `OLLAMA_BASE_URL` | 3, 4 |
| `OLLAMA_CHAT_MODEL` | 3, 4 |
| `OLLAMA_EMBEDDING_MODEL` | 3, 4 |

Week 2 additionally gets `VITE_QWEN_CHAT_MODEL` (or the app reads a small `/config` — prefer env exposed safely). Prefer: hardcode removed from `chat.ts`; use `import.meta.env.VITE_QWEN_CHAT_MODEL` with default `qwen3-chat`, and write `VITE_QWEN_CHAT_MODEL` into week2 `.env`. **Never** write `VITE_QWEN_API_KEY`.

## UI

- New section tab: **Settings** (global, not per-week)
- Form fields matching the API groups
- Save → PUT; then refresh GET
- Banner about Week 2 restart
- Keys as password inputs; leave blank to keep existing

## Runtime wiring

1. **Playground (week3/4):** `runPython` merges current settings into `env` so one-shot asks pick up new keys/models without rewriting timing races.
2. **Supervisor (week2 start):** spawn already inherits process env; writing `.env` is what Vite `loadEnv` needs — document restart.
3. **Read path:** `GET` reads from week4 `.env` as canonical (fallback week3, then defaults). All three are kept in sync on PUT.

## README updates

1. **`week2-react-app/README.md`**
   - Chat UI talks to self-hosted Qwen via Vite `/qwen` proxy
   - Document `QWEN_*` / `VITE_QWEN_CHAT_MODEL`
   - Point to dashboard Settings

2. **`internship-dashboard/README.md`**
   - Settings section: provider, keys, models
   - Week 2 restart note
   - Security: local-only; keys never returned in full

3. Optional one-liner in week3/week4 READMEs pointing at dashboard Settings

## Security

- Never return full API keys from GET
- Never log request bodies containing keys
- `.env` already gitignored
- Dashboard has no auth — localhost-only assumption remains

## Acceptance criteria

- [ ] Settings UI can set provider, Qwen key/URL/model, OpenAI key/URL/models, Ollama models
- [ ] Saving updates week2/3/4 `.env` without wiping unrelated vars
- [ ] Week 3/4 playground ask uses new settings immediately
- [ ] Week 2 chat uses chosen model after Stop+Start; key stays on Vite server only
- [ ] GET never exposes full secrets
- [ ] READMEs reflect live Qwen chat + Settings workflow
