# moducore

![CI](https://github.com/brigittelparnham/moducore/actions/workflows/ci.yml/badge.svg)

A modular, composable content platform. Each application (CMS, journal, and more) can run standalone, compose together inside the CMS host, or be embedded into external sites as web components.

## Docs

- [Architecture](docs/architecture.md) — system design, tech stack, composition model
- [Database Schema](docs/database-schema.md) — PostgreSQL tables, conventions, indexes
- [API Reference](docs/api.md) — all endpoints, auth, rate limits
- [Roadmap](docs/roadmap.md) — build phases, decision log

## Stack

- **Frontend** — React + Vite
- **API** — Hono (TypeScript)
- **Database** — PostgreSQL + Drizzle ORM
- **Auth** — better-auth
- **Monorepo** — Turborepo + pnpm workspaces
- **Embeds** — Web Components

## Structure

```
apps/
  api/        ← Hono API server
  cms/        ← CMS host application
  journal/    ← Standalone journal app
packages/
  ui/         ← Shared component library
  core/       ← Shared types and schemas
  db/         ← Database schema and query helpers
  integrations/ ← External API connector system
  embeds/     ← Web component wrappers
```
