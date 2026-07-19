# Plane

A project management tool inspired by [Plane](https://plane.so) — workspaces, projects, issues,
Kanban boards, cycles with burndown charts, comments, and real-time-ish notifications. Built
end-to-end — backend, frontend, infra, and tests — as a demonstration of production patterns:
JWT auth, event-driven notifications via Kafka, and integration tests against real infrastructure
via Testcontainers.

## Features

- **Auth** — JWT access/refresh tokens, Redis-backed refresh rotation with reuse detection, BCrypt password hashing
- **Workspaces** — multi-tenant, roles (Owner/Admin/Member/Guest), email invites
- **Projects** — per-project roles (Admin/Member/Viewer), public/secret visibility
- **Issues** — Kanban board with drag-and-drop, sequence numbers (`PROJ-123`), priorities, labels, assignees, sub-issues, activity log
- **Cycles** — sprints with a live burndown chart, add/remove issues from a cycle
- **Comments** — threaded on issues, with reactions
- **Notifications** — Kafka-driven: issue/comment events publish to a topic, a consumer fans them out to assignees, surfaced in an in-app inbox
- **Search** — Postgres full-text search (`tsvector` + GIN index) across issue titles/descriptions
- **Analytics** — workspace dashboard (open/overdue issues, completion %) and per-cycle burndown
- **API docs** — Swagger UI at `/swagger-ui/index.html`, auto-generated from the controllers

## Tech stack

**Backend:** Java 21, Spring Boot 3.5 (Web, Security, Data JPA, Validation), PostgreSQL 15, Redis 7,
Apache Kafka, MinIO (S3-compatible), Flyway migrations, JWT (jjwt), springdoc-openapi

**Frontend:** React 19, TypeScript, Vite, TanStack Query, React Router, Axios, Tailwind CSS v4

**Infra/Testing:** Docker Compose, multi-stage Dockerfiles + Nginx reverse proxy, GitHub Actions CI,
JUnit 5 + Mockito (unit), Testcontainers (integration — real Postgres/Kafka/Redis/MinIO, not mocks)

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   React SPA │──────▶│  Spring Boot API │──────▶│  PostgreSQL │
│  (Vite/TSX) │◀──────│    (REST, JWT)   │◀──────│  (Flyway)   │
└─────────────┘      └─────┬──────┬─────┘      └─────────────┘
                            │      │
                     ┌──────▼┐  ┌──▼───┐      ┌───────┐
                     │ Redis │  │ Kafka│─────▶│ Notif. │
                     │(auth, │  │(evts)│      │consumer│
                     │ rate  │  └──────┘      └───────┘
                     │ limit)│
                     └───────┘
```

Issue/comment mutations publish domain events straight to Kafka (`DomainEventPublisher`); a
`@KafkaListener` consumer reads them and writes in-app notifications for assignees. No transactional
outbox — direct publish was the deliberate tradeoff for this project's scope.

## Getting started

Requires Docker Desktop, Java 21, and Node 20+.

```bash
# 1. infra: Postgres, Redis, Kafka, MinIO
docker compose up -d

# 2. backend (http://localhost:8080)
cd backend
./mvnw spring-boot:run

# 3. frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Or run the whole thing containerized:

```bash
docker compose up -d --build   # backend + frontend services included in docker-compose.yml
```

Frontend proxies `/api/` to the backend automatically in both modes. API docs live at
`http://localhost:8080/swagger-ui/index.html` once the backend is up.

## Testing

```bash
cd backend
./mvnw test      # unit tests only (Mockito, no Docker needed)
./mvnw verify     # unit + integration tests (spins up real Postgres/Kafka/Redis/MinIO via Testcontainers)
```

## Project structure

```
backend/    Spring Boot API — package-per-domain (auth, workspace, project, issue, cycle, comment,
            notification, analytics, search, kafka, security, shared)
frontend/   React SPA — src/app (shell + views), src/api (backend clients), src/pages (auth/workspace)
docs/       day-by-day build notes and the original project plan (gitignored, local-only)
```
