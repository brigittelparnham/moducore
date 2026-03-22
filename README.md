# moducore

![CI](https://github.com/brigittelparnham/moducore/actions/workflows/ci.yml/badge.svg)

A suite of personal apps that work standalone, compose inside a shared CMS, and embed anywhere as web components. Multi-tenant, fully custom backend, no third-party auth or BaaS.

---

## Apps

| App | Port | Description |
|-----|------|-------------|
| `apps/api` | 3000 | Hono API server — single backend for all apps |
| `apps/cms` | 3001 | CMS: pages, media, connectors, settings, feed views |
| `apps/journal` | 3002 | Standalone rich-text journal with streaks and moods |
| `apps/spotify` | 3003 | Music journal — Spotify OAuth, listening stats, era breakdowns |
| `apps/maps` | 3004 | Travel tracker — OwnTracks ingest, journey detection, commute intelligence |
| `apps/habits` | 3005 | Lifestyle tracker — habits, limits, rewards, finance, Starling Bank sync |
| `apps/home` | 3006 | Landing page / app launcher |

## Packages

| Package | Description |
|---------|-------------|
| `packages/core` | Shared types, Zod schemas, `Serialized<T>` utility, `apiError` helper |
| `packages/db` | Drizzle ORM schema, typed query helpers, migrations |
| `packages/ui` | Shared React component library (TipTap rich-text editor, common UI) |
| `packages/integrations` | RSS + REST connector system with 15-minute scheduler |
| `packages/embeds` | Web component wrappers (IIFE build via `@r2wc/react-to-web-component`) |
| `packages/journal` | Journal composition layer (`JournalProvider`, `JournalListPage`, `JournalEditorPage`) |
| `packages/spotify` | Spotify data components (`NowPlaying`, `TopTracksCard`, `ListeningHours` D3 chart) |
| `packages/maps` | Maps components (`MapView`/Leaflet, `JourneyCard`, `SuggestPanel`, `CommuteStats`) |
| `packages/habits` | Habits composition layer (habit tracking, points, rewards, finance views) |
| `packages/hub` | `AppSwitcher` floating widget (shared across all apps) + `HubSettings` |

---

## Stack

- **Frontend** — React 18 + Vite, TypeScript
- **API** — [Hono](https://hono.dev/) (TypeScript, runs on Bun)
- **Database** — PostgreSQL 16 + [Drizzle ORM](https://orm.drizzle.team/)
- **Auth** — Fully custom (Node.js `crypto.scrypt` passwords, random session tokens, rolling cookie)
- **Rich text** — [TipTap v2](https://tiptap.dev/) (StarterKit + Placeholder)
- **Validation** — [Zod](https://zod.dev/) (shared via `packages/core`)
- **Logging** — [pino](https://getpino.io/) with `pino-pretty` in dev, JSON in prod
- **Email** — [Resend](https://resend.com/) (welcome + password reset)
- **Monorepo** — [Turborepo](https://turbo.build/) + pnpm workspaces
- **CI** — GitHub Actions with PostgreSQL service container
- **Charts** — D3.js (listening hours, music eras)
- **Maps** — Leaflet + OwnTracks

---

## Architecture highlights

**Composition model** — secondary apps are packages first, apps second. `packages/journal` exposes `JournalProvider` / `JournalListPage` / `JournalEditorPage`; `apps/journal` is a thin Vite wrapper. The CMS consumes the same package to show a read-only feed — it never duplicates the editor.

**Multi-tenancy** — row-level `tenant_id` throughout. Every query is scoped. No schema-per-tenant.

**Peer-to-peer data** — apps share a session cookie and call each other's API routes directly. The Journal's `DayContextPanel` calls `/habits/day-summary`, `/maps/day-summary`, and `/spotify/day-summary` concurrently to build a context strip for each entry date.

**Embeds** — any content can be embedded externally via scoped `embed_tokens`. Web components are built to a single IIFE (`moducore.iife.js`) and drop into any HTML page with a `<script>` tag.

**App hub** — `packages/hub` provides an `AppSwitcher` floating button present in every app. Apps are peers — the CMS is not a hub or shell, just another app.

---

## Getting started

### Prerequisites

- Node.js 22+ (or Bun)
- pnpm 8+
- Docker Desktop

### 1. Install

```bash
pnpm install
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Run migrations

```bash
for f in packages/db/migrations/*.sql; do
  PGPASSWORD=moducore psql -h localhost -U moducore -d moducore -f "$f"
done
```

### 4. Configure environment

Copy the example env and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
```

Required vars:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `postgresql://moducore:moducore@localhost:5432/moducore` |
| `AUTH_SECRET` | Random secret for session signing |
| `ENCRYPTION_KEY` | 32-byte base64 key for connector config encryption |
| `RESEND_API_KEY` | Resend API key (email) |
| `EMAIL_FROM` | Sender address, e.g. `hello@yourdomain.com` |

Optional (for specific apps):

| Variable | Description |
|----------|-------------|
| `HABITS_HEALTH_SECRET` | Shared secret for iPhone Steps webhook |
| `LOCATION_INGEST_SECRET` | Shared secret for OwnTracks location ingest |
| `TFL_APP_KEY` | TfL API key for live line status |

### 5. Run

```bash
# All apps in parallel
pnpm turbo dev

# Or individual apps
pnpm --filter @moducore/api dev        # API  → :3000
pnpm --filter @moducore/cms dev        # CMS  → :3001
pnpm --filter @moducore/journal dev    # Journal → :3002
```

Then open [http://localhost:3001](http://localhost:3001) to sign up and explore.

---

## Testing

```bash
# Unit tests (no DB required)
pnpm turbo test

# Integration tests (requires TEST_DATABASE_URL)
TEST_DATABASE_URL=postgresql://moducore:moducore@localhost:5432/moducore pnpm turbo test
```

Unit tests cover Zod schemas, journey detection, haversine distance, suggestion engine, and habit streak logic. Integration tests cover the full auth and pages flows against a real database.

---

## Docs

- [Architecture](docs/architecture.md) — system design, composition model, decision log
- [Database Schema](docs/database-schema.md) — all tables, conventions, indexes
- [API Reference](docs/api.md) — every endpoint, auth requirements, rate limits
- [Roadmap](docs/roadmap.md) — 14 build phases with decision notes
