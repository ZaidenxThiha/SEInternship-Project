# Week 1 — User Management Mini API

Internship Phase 1 / Week 1 deliverable: a CRUD user API with JWT auth, role-based access, PostgreSQL + Prisma, Swagger docs, seed data, and Docker Compose.

## Stack

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT authentication (`USER` / `ADMIN`)
- Zod validation
- Swagger UI at `/api/docs`
- Docker Compose

## Quick start (Docker)

```bash
docker compose up --build
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Health: http://localhost:3000/health

### Seeded admin

| Email | Password | Role |
|--------|----------|------|
| `admin@example.com` | `Admin123!` | `ADMIN` |

## Local development

```bash
cp .env.example .env
docker compose up db -d
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

> Local note: Postgres is mapped to host port **5433** (avoids conflict with a local Postgres on 5432). Inside Docker Compose, the API still talks to `db:5432`.

## API overview

| Method | Path | Access |
|--------|------|--------|
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/users/me` | Authenticated |
| `GET` | `/api/users` | Admin |
| `GET` | `/api/users/:id` | Self or Admin |
| `PATCH` | `/api/users/:id` | Self or Admin (role change: Admin only) |
| `DELETE` | `/api/users/:id` | Admin |

Send `Authorization: Bearer <token>` for protected routes.

## Example flow

```bash
# Login as admin
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# Register a user
curl -s -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"User1234!","name":"Demo User"}'

# List users (admin token)
curl -s http://localhost:3000/api/users \
  -H "Authorization: Bearer <TOKEN>"
```

## Project structure

```
src/
  config/          # env, swagger
  middlewares/     # auth, validate, errors
  modules/auth/    # register + login
  modules/users/   # CRUD
  lib/             # prisma, logger, AppError
prisma/            # schema + seed
```
