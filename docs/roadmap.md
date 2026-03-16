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

Second app. Proves the plugin/connection model.

**Model:** Journal is an independent authoring app. When connected to the CMS, the CMS shows a live read-only feed with links back to the journal app for editing. The CMS never duplicates the journal editor.

- [x] Add `journal_entries` table, run migration
- [x] API routes: CRUD for journal entries (scoped to tenant) — `GET/POST /journal`, `GET/PATCH/DELETE /journal/:id`, publish/unpublish
- [x] `apps/journal` standalone: full authoring — entry list, entry editor, publish flow
- [x] `packages/journal` extracted: `JournalProvider`, `JournalListPage`, `JournalEditorPage` — shared components used by apps/journal
- [x] App registry: `tenant_apps` table + `GET/POST/DELETE /apps` routes + install/uninstall UI in CMS Settings
- [x] CMS connected journal feed: read-only feed of entries, "Edit in Journal →" links, "Open Journal →" header

**Done when:** tenant can install journal, see the live feed in CMS, and click through to the journal app to write/edit.

---

## Phase 6 — Embed System

Proves the external portability model.

- [x] Embed token management: generate, list, revoke tokens in CMS Settings → Embed Tokens
- [x] API token validation: `validateEmbedToken` helper + `GET /embed/journal?token=xxx` public endpoint
- [x] `packages/embeds`: `JournalWidget` React component wrapped as `<journal-widget>` web component via `@r2wc/react-to-web-component`
- [x] Build: `vite build` in IIFE mode → `dist/journal.iife.js` (self-contained, React bundled)
- [x] Test file: `embed-test.html` at repo root — load the bundle and use the widget with a real token
- [ ] End-to-end test: generate token in CMS, build bundle, serve test page, verify widget renders entries

**Done when:** journal widget is embeddable on any external site with a script tag.

---

## Phase 7 — Integration / Connector System

Unlocks the external data feeds.

- [x] `packages/integrations` scaffold: connector interface, runtime fetcher, cache layer
- [x] Add `connectors` + `connector_data_cache` tables, run migration
- [x] First connector: RSS (simple, no auth needed — good for testing the pattern)
- [x] Connector config UI in CMS settings
- [x] `useConnector` hook available in any app
- [x] Scheduled sync (cron job or queue) — fetch + cache on interval (15 min, via `setInterval` in `apps/api/src/scheduler.ts`)
- [x] Second connector: generic REST (user provides URL + headers — covers most simple APIs)

**Done when:** a tenant can configure an RSS feed, and journal entries can display data from it.

---

## Phase 8 — Polish + Second Embed

- [x] Block-based editor for CMS pages + journal entries (TipTap StarterKit in packages/ui; RichTextEditor shared component with toolbar; PageEditorPage + JournalEditorPage updated; PublicPageView renders HTML; backwards-compatible with prior { text } format)
- [x] CMS page embeds as web component (`GET /embed/pages` + `/embed/pages/:slug`; `<cms-page>` + `<cms-pages>` widgets; bundle renamed to `moducore.iife.js`; embed-test.html updated with all 4 widgets)
- [x] Media upload for CMS (drag-drop upload + image grid + copy URL + delete; static serving via `GET /uploads/*`; `🖼` toolbar button in TipTap editor)
- [x] Tenant settings page (name, slug) — `GET/PATCH /tenants/current`; WorkspaceSection in CMS Settings; slug availability check; owner/admin only
- [x] Basic email: transactional emails via Resend — welcome email on signup; password reset flow (`POST /auth/forgot-password` + `/auth/reset-password`; 1-hour token; `/forgot-password` + `/reset-password` frontend pages; "Forgot password?" link on login)

---

## Phase 9 — Spotify Music Journal

A music journal app: "what I listen to tells a story about me." Each tenant connects their own Spotify account using their own Spotify developer app credentials (no central quota). Data syncs on the existing 15-min scheduler. Visual views built with D3.

**Model:** Same plugin pattern as journal — `apps/spotify` (standalone, port 3003) + `packages/spotify` (shared components). CMS shows a read-only music feed with "Open Spotify App →" link.

**Credentials model:** Each tenant pastes their own Spotify `client_id` + `client_secret` into CMS Settings. They register their own Spotify developer app and add the API callback URL as an allowed redirect URI. No central Spotify quota problem.

- [ ] DB schema: `spotify_connections` (credentials + OAuth tokens, one per tenant) + `spotify_data_cache` (synced snapshots, unique per tenant+type)
- [ ] Migration + query helpers
- [ ] API routes (`/spotify/status`, `/spotify/credentials`, `/spotify/connect`, `/spotify/callback`, `/spotify/data/:type`, `/spotify/now-playing`, `/spotify/sync`)
- [ ] OAuth flow: save state token → redirect to Spotify → callback exchanges code → stores tokens → redirects to apps/spotify
- [ ] Token refresh: auto-refresh access token when expired (Spotify tokens expire in 1 hour)
- [ ] Scheduler integration: sync top_tracks × 3 ranges, top_artists × 3 ranges, recently_played, audio_features every 15 min
- [ ] `packages/spotify`: SpotifyProvider, createSpotifyApi, types, SpotifyDashboardPage
- [ ] `apps/spotify` (port 3003): SpotifyConnectPage (enter credentials + OAuth), SpotifyDashboardPage
- [ ] Visual components: NowPlaying, TopTracksCard (4wk/6mo/all-time toggle), TopArtistsCard
- [ ] D3 charts: GenreChart (horizontal bar, genres derived from top artists), VibeBoard (radar: danceability/energy/valence/acousticness/instrumentalness)
- [ ] CMS integration: Spotify section in Settings (credentials form + connect link + status); SpotifyFeedPage in CMS nav (last played + top 3 tracks, read-only)
- [ ] Embed widgets: `<spotify-top-tracks>`, `<spotify-now-playing>`, `<spotify-genre-chart>` + public embed routes
- [ ] Add to moducore.iife.js bundle

**Scopes:** `user-top-read user-read-recently-played user-read-currently-playing user-read-playback-state`

**Env vars:** `SPOTIFY_APP_URL=http://localhost:3003` in apps/api/.env. Tenant credentials stored in DB (not env).

**Done when:** tenant can connect Spotify, see their music journal dashboard, and embed widgets on an external site.

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
| Auth | Fully custom (crypto.scrypt) | 2026-03 | Full ownership, no vendor lock-in |
| Embedding | Web Components | 2026-03 | Most portable, works anywhere |
| Backend | Fully custom | 2026-03 | No vendor lock-in, no ongoing costs |
| Multi-tenancy | Row-level (tenant_id) | 2026-03 | Simpler than schema-per-tenant |
| App composition | Plugin / connected feed | 2026-03 | Secondary apps author independently; CMS shows read-only feed with links back. CMS never duplicates editor UI. |
| Spotify credentials | Tenant-owned (each tenant brings their own client_id/secret) | 2026-03 | Avoids central Spotify dev quota (5 users in dev mode). Aligns with self-hosted ethos. Tenants register their own Spotify developer app. |
| Spotify charts | D3 (not Recharts) | 2026-03 | Full control over bespoke visual styling for the music journal aesthetic. |
