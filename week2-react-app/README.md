# Week 2 — React Full-Stack Demo

Internship Phase 1 / Week 2 deliverable: a React frontend with TailwindCSS, shadcn-style UI components, Zustand auth state, protected routing, a live chat UI backed by self-hosted **Qwen** (OpenAI-compatible API on a VPS), and CRUD screens connected to the Week 1 user API.

## Stack

- React 19 + Vite + TypeScript
- TailwindCSS v4
- shadcn/ui-style components (Radix + CVA)
- Zustand (persisted auth store)
- React Router (protected + admin routes)
- Axios (API client with interceptors)
- Nginx + Docker Compose (full-stack)

## Features

| Feature | Route | Access |
|---------|-------|--------|
| Login / Register | `/login`, `/register` | Public |
| Live Qwen chat | `/chat` | Authenticated |
| Profile CRUD | `/profile` | Authenticated |
| User list CRUD | `/users` | Admin only |

## Quick start (Docker — full stack)

Runs the Week 1 API, PostgreSQL, and this React app together:

```bash
docker compose up --build
```

- App: http://localhost:5173
- API (internal): proxied at `/api` through Nginx

### Seeded admin

| Email | Password | Role |
|--------|----------|------|
| `admin@example.com` | `Admin123!` | `ADMIN` |

## Local development

1. Start the Week 1 API (from `../week1-user-api`):

```bash
docker compose up --build
# or: npm run dev with local Postgres
```

2. Start the frontend:

```bash
cp .env.example .env
# Set QWEN_API_KEY (and optionally QWEN_BASE_URL / VITE_QWEN_CHAT_MODEL)
npm install
npm run dev
```

- App: http://localhost:5173
- Vite dev proxy forwards `/api` → `http://localhost:3000`
- Chat calls `/qwen/v1/chat/completions`; Vite injects `Authorization: Bearer $QWEN_API_KEY` (key never goes to the browser)

### LLM env (or use the internship dashboard Settings)

| Variable | Purpose |
|----------|---------|
| `VITE_LLM_PROVIDER` | `qwen` \| `openai` \| `gemini` (browser chat) |
| `QWEN_*` / `OPENAI_*` / `GEMINI_*` | Server-side keys + URLs for Vite proxies (`/qwen`, `/openai`, `/gemini`) |
| `VITE_*_CHAT_MODEL` | Client-safe model names only (never put API keys under `VITE_`) |

Prefer configuring these once in **internship-dashboard → Settings** (writes week2/3/4 `.env`). After changing provider or chat key/URL/model, **Stop + Start Week 2** so Vite reloads the proxy.

## Demo flow

1. Open http://localhost:5173/login
2. Sign in as admin (`admin@example.com` / `Admin123!`)
3. **Chat UI** — ask a question; replies come from `qwen3-chat` (or your configured model) on the VPS
4. **Users (Admin)** — list, create, edit role, delete users
5. **My Profile** — view/update your own account
6. Register a normal user and confirm `/users` is hidden (role-based routing)

## Project structure

```
src/
  api/              # Axios client, auth + users API
  components/
    layout/         # App shell + navigation
    ui/             # Button, Card, Dialog, etc.
  pages/            # Login, Register, Chat, Profile, Users
  routes/           # ProtectedRoute, AdminRoute
  stores/           # Zustand auth store
  types/
```

## Week 2 requirements covered

- React components, props, state, hooks (`useState`, `useEffect`)
- Zustand for auth state
- TailwindCSS + shadcn/ui-style components
- Axios with loading/error handling
- React Router with role-based route protection
- Full-stack integration with Week 1 API (auth + CRUD)
- Responsive layout (mobile-friendly nav + chat)
