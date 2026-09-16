# Week 2 — React Full-Stack Demo

Internship Phase 1 / Week 2 deliverable: a React frontend with TailwindCSS, shadcn-style UI components, Zustand auth state, protected routing, a static chat UI, and CRUD screens connected to the Week 1 user API.

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
| Static chat UI | `/chat` | Authenticated |
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
npm install
npm run dev
```

- App: http://localhost:5173
- Vite dev proxy forwards `/api` → `http://localhost:3000`

## Demo flow

1. Open http://localhost:5173/login
2. Sign in as admin (`admin@example.com` / `Admin123!`)
3. **Chat UI** — send sample messages (local replies, no AI yet)
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
