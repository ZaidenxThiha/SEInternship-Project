# Dashboard LLM Settings Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Shared LLM Settings UI on the internship dashboard that upserts Qwen/OpenAI/Ollama keys and models into week2/3/4 `.env` files.

**Architecture:** Server module `llmSettings.ts` reads/writes `.env`; Express routes `GET/PUT /api/llm-settings`; Settings panel in the dashboard UI; Week 2 chat model from `VITE_QWEN_CHAT_MODEL`; playground Python merges env on spawn.

**Tech Stack:** Express + TypeScript (dashboard server), React + Vite (dashboard web + week2), dotenv-style `.env` files.

## Global Constraints

- Never return full API keys from GET; mask with `apiKeyHint`
- Never write `VITE_*` secret keys
- Empty key string on PUT = leave unchanged; clear flags to wipe
- Week 2 restart required after Qwen changes (document in UI + README)

---

## File map

| File | Action |
|------|--------|
| `internship-dashboard/server/src/llmSettings.ts` | Create — parse/upsert `.env`, get/put settings |
| `internship-dashboard/server/src/index.ts` | Add GET/PUT routes |
| `internship-dashboard/server/src/playground.ts` | Merge LLM env into Python/pytest spawns |
| `internship-dashboard/web/src/api.ts` | Client methods + types |
| `internship-dashboard/web/src/LlmSettings.tsx` | Create — Settings form |
| `internship-dashboard/web/src/App.tsx` | Settings section tab |
| `week2-react-app/src/api/chat.ts` | Model from `VITE_QWEN_CHAT_MODEL` |
| `week2-react-app/.env.example` | Document Qwen vars |
| `week2-react-app/README.md` | Live Qwen chat |
| `internship-dashboard/README.md` | Settings docs |

---

### Task 1: Server `llmSettings` module + routes

- [x] Create `llmSettings.ts` with defaults, parseEnvFile, upsertEnvFile, getLlmSettings, putLlmSettings
- [x] Target paths: week2/3/4 dirs via `WEEKS` / `REPO_ROOT`
- [x] Wire `GET/PUT /api/llm-settings` in `index.ts`
- [x] Smoke: hit GET with curl after server start

### Task 2: Merge env into playground

- [x] `runPython` and week4 pytest use `{ ...process.env, ...llmEnvForProcess() }`
- [x] Confirm week3 ask inherits updated provider without restart

### Task 3: Dashboard Settings UI

- [x] Types + `client.getLlmSettings` / `putLlmSettings` in `api.ts`
- [x] `LlmSettings.tsx` form (provider, qwen, openai, ollama)
- [x] Add `settings` section in `App.tsx`

### Task 4: Week 2 model + READMEs

- [x] `chat.ts` uses `import.meta.env.VITE_QWEN_CHAT_MODEL || 'qwen3-chat'`
- [x] Update `.env.example`, week2 README, dashboard README
