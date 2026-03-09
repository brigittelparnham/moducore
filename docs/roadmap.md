# Build Roadmap

Build order is intentional: infrastructure before features, each phase unlocks the next.

---

## Phase 1 — Monorepo Scaffold

Get the repo structure right before writing any application code. This is cheap to do now and expensive to change later.

- [x] Initialize pnpm workspaces + Turborepo
- [x] Create `apps/api`, `apps/cms`, `apps/journal` with Vite (React) / Hono
- [x] Create `packages/ui`, `packages/core`, `packages/db`, `packages/integrations`, `packages/embeds`, `packages/journal`
- [x] Configure shared TypeScript (`tsconfig.base.json`)
- [x] Configure Turbo pipeline (`build`, `dev`, `lint`, `test`)
- [x] Set up ESLint + Prettier across the monorepo
- [x] Verify `turbo build` passes all 9 packages (9/9 successful)

**Done when:** `pnpm dev` starts all apps, packages are importable across apps, types are shared.

> **Note:** Run all commands with `PATH="/opt/homebrew/bin:/usr/bin:/bin:$PATH"` prefix until nvm default is updated to Node >=18.

---

## Phase 2 — Database + Migrations

- [x] Set up PostgreSQL locally (`docker-compose.yml` — requires Docker Desktop to run)
- [x] Initialize Drizzle in `packages/db` with `drizzle.config.ts`
- [x] Write schema: `tenants`, `users`, `tenant_members`, `sessions`, `embed_tokens`
- [x] Run first migration (`pnpm --filter @moducore/db db:generate && db:migrate`)
- [x] Create typed query helpers in `packages/db/src/queries/`
- [x] `updated_at` handled at query layer (set explicitly on update calls)

**Done when:** migrations run cleanly, query helpers return properly typed results.

> **To run the database:** Install Docker Desktop, then `docker compose up -d` from the repo root.

---

## Phase 3 — Auth

This is the foundation everything else depends on. Get it right before building features.

- [x] Custom auth — no external service, uses Node.js `crypto.scrypt` for password hashing
- [x] Signup: creates user + tenant + owner membership in a single transaction
- [x] Login / logout (session token, httpOnly cookie, 30-day expiry)
- [x] `sessionMiddleware` — resolves session on every request, attaches user/tenant/member to context
- [x] `requireAuth` / `requireRole` middleware
- [x] Auth state in CMS frontend via `AuthContext` — checks `/auth/me` on load
- [x] CMS pages: `/signup`, `/login`, `/` (dashboard, protected)
- [x] Timing-safe login (prevents user enumeration)

**Done when:** a user can sign up, creates a tenant, logs in, and the API correctly scopes requests to their tenant.

> **To test:** Install Docker Desktop, run `docker compose up -d`, run migrations (Phase 2), then `pnpm dev`.

---

## Phase 4 — CMS Core

First real feature. Proves the stack end-to-end.

- [x] Add `pages` and `media` tables, migration run
- [x] API routes: CRUD for pages (scoped to tenant) — `GET/POST /pages`, `GET/PATCH/DELETE /pages/:id`, `POST /pages/:id/publish|unpublish`
- [x] CMS frontend: pages list, page editor (textarea body, auto-slug from title)
- [x] Publish / unpublish a page
- [x] Public page rendering: `GET /public/:tenantSlug/pages/:slug` (API) + `/p/:tenantSlug/:slug` (CMS route)
- [ ] Shared `packages/ui` components — deferred to Phase 8 (inline styles used for now)

**Done when:** a tenant can create, edit, publish, and view a CMS page.

---

## Phase 5 — Journal App

Second app. Proves the multi-app composition model.

- [ ] Add `journal_entries` table, run migration
- [ ] API routes: CRUD for journal entries (scoped to tenant)
- [ ] `apps/journal` standalone: entry list, entry editor, publish flow
- [ ] `packages/journal` extracted: journal components importable as a package
- [ ] `apps/cms` installs journal: journal section appears inside CMS nav
- [ ] App registry: `apps` + `tenant_apps` tables, install/uninstall flow in CMS settings

**Done when:** journal works standalone AND embedded inside the CMS. A tenant can install/uninstall it.

---

## Phase 6 — Embed System

Proves the external portability model.

- [ ] Embed token management: generate, list, revoke tokens in CMS settings
- [ ] API token validation middleware: validates embed token on requests from external sites
- [ ] `packages/embeds`: wrap journal components as web components using `@r2wc/react-to-web-component`
- [ ] Build + serve `journal.js` bundle from `apps/api` or a CDN
- [ ] Test: embed `<journal-widget>` in a plain HTML file, verify read works
- [ ] Test: embed with `mode="read-write"` and a write-scoped token, verify write works
- [ ] Document embed usage

**Done when:** journal widget is embeddable on any external site with a script tag.

---

## Phase 7 — Integration / Connector System

Unlocks the external data feeds.

- [ ] `packages/integrations` scaffold: connector interface, runtime fetcher, cache layer
- [ ] Add `connectors` + `connector_data_cache` tables, run migration
- [ ] First connector: RSS (simple, no auth needed — good for testing the pattern)
- [ ] Connector config UI in CMS settings
- [ ] `useConnector` hook available in any app
- [ ] Scheduled sync (cron job or queue) — fetch + cache on interval
- [ ] Second connector: generic REST (user provides URL + headers — covers most simple APIs)

**Done when:** a tenant can configure an RSS feed, and journal entries can display data from it.

---

## Phase 8 — Polish + Second Embed

- [ ] Block-based editor for CMS pages + journal entries (TipTap or BlockNote)
- [ ] CMS page embeds as web component
- [ ] Media upload for CMS
- [ ] Tenant settings page (name, slug, app management)
- [ ] Basic email: transactional emails for signup / password reset (Resend or SMTP)

---

## Future Phases (not yet scoped)

- Additional connector adapters (Shopify, hospitality APIs, etc.)
- More secondary apps (beyond journal)
- Subdomain provisioning (DNS / SSL automation)
- Billing / plan limits
- Public connector marketplace
- Self-hosted deployment guide

---

## Decision Log

| Decision | Choice | Date | Reason |
|---|---|---|---|
| Frontend | React + Vite | 2026-03 | Specified requirement |
| Monorepo | Turborepo + pnpm | 2026-03 | Best DX at this scale |
| API | Hono | 2026-03 | Modern, TS-first |
| Database | PostgreSQL | 2026-03 | Multi-tenant relational data |
| ORM | Drizzle | 2026-03 | Close to SQL, great TS types |
| Auth | better-auth (library) | 2026-03 | Full ownership, no vendor |
| Embedding | Web Components | 2026-03 | Most portable, works anywhere |
| Backend | Fully custom | 2026-03 | No vendor lock-in, no ongoing costs |
| Multi-tenancy | Row-level (tenant_id) | 2026-03 | Simpler than schema-per-tenant |
