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

- [x] DB schema: `spotify_connections` (credentials + OAuth tokens, one per tenant) + `spotify_data_cache` (synced snapshots, unique per tenant+type)
- [x] Migration + query helpers
- [x] API routes (`/spotify/status`, `/spotify/credentials`, `/spotify/connect`, `/spotify/callback`, `/spotify/data/:type`, `/spotify/now-playing`, `/spotify/sync`)
- [x] OAuth flow: save state token → redirect to Spotify → callback exchanges code → stores tokens → redirects to apps/spotify
- [x] Token refresh: auto-refresh access token when expired (Spotify tokens expire in 1 hour)
- [x] Scheduler integration: sync top_tracks × 3 ranges, top_artists × 3 ranges, recently_played every 15 min (audio_features + genres not returned by Spotify for new dev apps)
- [x] `packages/spotify`: SpotifyProvider, createSpotifyApi, types, SpotifyDashboardPage
- [x] `apps/spotify` (port 3003): SpotifyConnectPage (enter credentials + OAuth), SpotifyDashboardPage
- [x] Visual components: NowPlaying, TopTracksCard (4wk/6mo/all-time toggle), TopArtistsCard, ListeningHours (D3 bar), MusicEras (D3 bar)
- [x] CMS integration: SpotifyFeedPage in CMS nav (last played + top 3 tracks, read-only)
- [ ] Embed widgets: `<spotify-top-tracks>`, `<spotify-now-playing>` + public embed routes — deferred

**Scopes:** `user-top-read user-read-recently-played user-read-currently-playing user-read-playback-state`

**Env vars:** `SPOTIFY_APP_URL=http://localhost:3003` in apps/api/.env. Tenant credentials stored in DB (not env).

**Done when:** tenant can connect Spotify, see their music journal dashboard, and embed widgets on an external site.

**COMPLETE.** DB schema, OAuth flow, token refresh, 15-min sync scheduler, NowPlaying/TopTracksCard/TopArtistsCard/ListeningHours/MusicEras (D3) components, apps/spotify standalone (port 3003), CMS music feed + nav. Note: Spotify deprecated audio features + genres/popularity for new dev apps — those chart types removed.

---

## Phase 10 — Maps & Commute Intelligence

A personal travel journal: "where I go and how I get there tells a story about me." Tracks real journeys via OwnTracks (iOS/Android background GPS app), detects trips automatically, and builds up a personal baseline for route times. Combines that historical data with live TfL conditions and weather to give smarter route suggestions than Google Maps — because it knows *your* actual pace and *your* actual routes.

**Model:** Same plugin pattern — `apps/maps` (standalone, port 3004) + `packages/maps` (shared components). CMS shows a travel feed. OwnTracks is the tracking layer (no native app needed — configure it to POST to the moducore API).

**Three suggestion modes (all built from the same data):**
1. **Passive / historical** — "Your Tuesday commute averages 41 min. You're fastest leaving between 8:15–8:30am."
2. **Active / live** — "Right now: Jubilee line suspended. TfL estimates your usual route at 54 min."
3. **Combined** — "Your usual route is disrupted today (+13 min). When this happened before, you took bus 168 + walk — that averaged 38 min vs your usual 41. Bus 168 is running normally right now."

The combined mode learns *which alternatives you actually use* when disrupted, and how long they took you — not just what TfL estimates.

**Context:** London, iOS, walking + public transit + cycling. No cars. TfL API (free, requires app key). Open-Meteo for weather (free, no key).

---

### Data model

```
location_pings         — raw OwnTracks pings
  id, tenant_id, lat, lon, accuracy_m, velocity_ms, altitude_m, battery_pct,
  recorded_at (from OwnTracks tst), received_at, processed (bool)

journeys               — detected trips, one row per trip
  id, tenant_id, started_at, ended_at,
  origin_lat, origin_lon, dest_lat, dest_lon,
  distance_m, duration_s,
  mode (walking|cycling|transit|mixed),
  tfl_estimated_s,          -- TfL Journey Planner result at time of trip
  tfl_route (jsonb),        -- lines/legs TfL suggested
  weather_summary (jsonb),  -- Open-Meteo snapshot at trip start
  ping_ids (int[]),         -- FK to location_pings used to build this journey
  route_id (uuid, nullable) -- FK to known_routes if matched

known_routes           — named routes the user defines or the system learns
  id, tenant_id, name (e.g. "Home → Work"),
  origin_lat, origin_lon, dest_lat, dest_lon,
  typical_duration_s,       -- rolling average of actual journey durations
  personal_ratio,           -- user's actual time ÷ TfL estimate (updated on each journey)
  journey_count

known_places           — named locations (home, work, gym, etc.)
  id, tenant_id, name, lat, lon, radius_m
```

---

### Journey detection (scheduler, every 5 min)

1. Find unprocessed pings ordered by `recorded_at`
2. Split into journeys: gap of > 5 min without movement (< 20m displacement) = journey boundary
3. For each journey segment:
   - Calculate total distance (Haversine between consecutive pings)
   - Calculate avg speed → infer mode: < 4 km/h = walking, < 25 km/h = cycling, > 25 km/h = transit
   - Match origin/dest to `known_places` (within radius)
   - Call TfL Journey Planner for origin→dest at `started_at` time (async, best-effort)
   - Fetch Open-Meteo for origin coords + started_at (async, best-effort)
   - Upsert `journeys` row; mark pings as processed
4. Update `known_routes.typical_duration_s` + `personal_ratio` rolling average

---

### Suggestion engine (called live, on demand)

Input: current location (lat/lon) + destination (lat/lon or known place name)

```
score(route_option) =
  tfl_estimate_s
  × personal_ratio          // your historical ratio vs TfL (e.g. 0.88 = you're faster)
  × disruption_multiplier   // 1.0 = clear, 1.3+ = delays, 2.0 = suspended
  × weather_factor          // rain: cycling +20%, walking +10%, transit unchanged
```

Returns ordered list of route options with:
- Estimated time (personalised)
- Confidence ("strong" = 10+ journeys, "early" = < 5, "live only" = no history)
- Disruption warnings for each line used
- Callout if an alternative route performs better historically under today's conditions

---

### API routes (`apps/api/src/routes/maps.ts`)

```
POST /location/ingest               — OwnTracks webhook (no auth, validated by secret token in URL)
GET  /journeys                      — list journeys (requireAuth, paginated)
GET  /journeys/:id                  — single journey with full ping trace
GET  /routes                        — list known routes + stats
POST /routes                        — create/name a route
GET  /places                        — list known places
POST /places                        — create/name a place
GET  /suggest?from=lat,lon&to=lat,lon — live route suggestions (requireAuth)
POST /journeys/:id/label            — label a journey with a route name
```

---

### `packages/maps` components

- **`MapView`** — Leaflet map (OpenStreetMap tiles, no API key) rendering a journey polyline
- **`JourneyList`** — scrollable list of trips, actual vs TfL time, mode icon
- **`JourneyCard`** — single trip: map thumbnail, duration, mode, disruption note
- **`SuggestPanel`** — the active suggestion screen: shows ranked route options with live conditions + personal history callout
- **`CommuteStats`** — passive historical view: avg times by day of week, best departure windows, personal ratio vs TfL

---

### `apps/maps` (port 3004)

- `/` — today's journeys + SuggestPanel for next trip (detects current location)
- `/journeys` — full journey history with filters
- `/routes` — named routes + stats per route
- `/settings` — known places (home, work, etc.), TfL API key

---

### CMS integration

- **Maps feed page** (`/travel`) — today's journeys, commute streak, "Open Maps →" link
- Shown in nav when maps app is installed

---

### External APIs

| API | Purpose | Auth | Cost |
|---|---|---|---|
| TfL Unified API | Journey Planner, line status, disruptions | App key (query param) | Free |
| Open-Meteo | Weather at journey time | None | Free |
| OpenStreetMap / Leaflet | Map tiles + display | None | Free |

TfL app key stored in `apps/api/.env` as `TFL_APP_KEY`. Not per-tenant — this is personal data for a single user.

---

### OwnTracks setup (tenant does this once)

1. Install OwnTracks from App Store
2. Settings → Connection → Mode: **HTTP**
3. URL: `https://YOUR_API/location/ingest?secret=YOUR_SECRET_TOKEN`
4. Auth: none (secret is in URL)
5. Reporting interval: every 10s when moving, every 5 min when stationary

A `LOCATION_INGEST_SECRET` env var gates the ingest endpoint.

---

### Build sequence

1. DB schema + migration (4 tables)
2. OwnTracks ingest endpoint (`POST /location/ingest`)
3. Journey detection scheduler job
4. Known places + named routes API
5. TfL + Open-Meteo integration helpers
6. Suggestion engine
7. `packages/maps` — MapView (Leaflet), JourneyList, JourneyCard
8. `apps/maps` — journey history + suggest panel
9. CommuteStats passive view
10. CMS integration — travel feed page + nav
11. `turbo build` clean

---

**Done when:** OwnTracks is sending pings → journeys are detected automatically → the suggestion screen shows personalised route options combining historical data with live TfL conditions and weather.

**COMPLETE.** DB schema (4 tables), OwnTracks ingest endpoint, journey detection scheduler (5-min), TfL + Open-Meteo helpers, suggestion engine, `packages/maps` (MapView/Leaflet, JourneyCard, JourneyList, SuggestPanel, CommuteStats, MapsDashboardPage), `apps/maps` (port 3004), CMS travel feed + nav + settings section. 13/13 build clean.

---

## Phase 11 — Habits & Lifestyle Tracker

A full lifestyle tracker: habits you want to build, limits you want to respect, rewards you earn, and a personal finance layer that ties it all together. "Only 2 takeaways this month → unlocks £50 to spend on something." Tracks daily, weekly, monthly, and yearly — one habit can have targets at all scales simultaneously.

**Model:** Same plugin pattern — `apps/habits` (standalone, port 3005) + `packages/habits` (shared components). CMS shows a lifestyle feed. Finance sits inside the habits app (not a separate app — lifestyle and money are inseparable).

**Three layers:**
1. **Habits** — things to do more of. Each habit can have a daily, weekly, monthly, and yearly target simultaneously. Streak tracking per time scale. Each log can earn points.
2. **Limits** — things to cap. "Max 2 takeaways/month." Uses the same habit/target model with `target_type: max`. Staying within a limit can unlock a specific reward.
3. **Finance** — personal spending tracker. Manual accounts + Starling bank sync. Auto-categorises transactions by learning from per-tenant merchant→category corrections (no AI — rule-based string matching, gets smarter as you correct it). Budget rules per category. CSV import for history.

**Reward system (hybrid):**
- Some habits earn **points** per log (e.g., each workout = 10 pts). Points are spent on point-cost rewards.
- Some habits/limits trigger **condition unlocks** (e.g., "stay within takeaway limit for November → £50 shopping unlocked").
- Both use the same `rewards` table — different `reward_type`.

**Starling integration:** Personal Access Token (user generates in Starling developer portal, pastes into Settings). Syncs current account + savings spaces on the existing 15-min scheduler. Starling's own category codes bootstrap auto-categorisation on first import.

**iPhone Steps:** `POST /habits/health-ingest?secret=TOKEN` endpoint. Settings page outputs the exact iOS Shortcut configuration (JSON + instructions) the user sets up once — runs nightly, reads step count from Apple Health, POSTs to the API.

---

### Data model

```
habits              — name, icon, color, unit, type (habit|limit), points_per_log, archived
habit_targets       — habit_id, frequency (daily|weekly|monthly|yearly), target_value, target_type (min|max)
habit_logs          — habit_id, value, logged_at, source (manual|health_shortcut|bank_auto)
rewards             — name, type (unlock|points_spend), points_cost, condition_habit_id,
                      condition_frequency, earned_at, redeemed_at, monetary_value
points_balance      — ledger (delta per event, reason, ref_id)

accounts            — name, type (current|savings|cash|credit|investment), starting_balance,
                      starting_balance_date, provider (manual|starling), starling_account_uid,
                      starling_access_token
categories          — name, icon, color, type (income|expense|transfer), linked_habit_id
merchant_rules      — tenant_id, merchant_pattern (lowercase fragment), category_id, match_count
transactions        — account_id, amount (positive=in, negative=out), description, merchant,
                      category_id, category_confirmed, date, source (manual|starling_import|csv_import),
                      external_id (dedup)
budget_rules        — category_id, period (weekly|monthly|yearly), limit_amount
```

---

### API routes

```
POST /habits/health-ingest?secret=   — iPhone Shortcut webhook (public, secret-gated)
GET/POST   /habits                   — list / create habits
GET/PATCH/DELETE /habits/:id         — single habit
GET/POST   /habits/:id/targets       — manage time-scale targets
POST       /habits/:id/log           — log a value (triggers points + reward checks)
GET        /habits/:id/logs          — log history
GET        /habits/streaks           — all streaks, current + best

GET/POST   /rewards                  — list / create rewards
POST       /rewards/:id/redeem       — redeem a reward
GET        /points                   — current balance + recent ledger

GET/POST   /accounts                 — list / create accounts
GET        /accounts/:id/balance     — running balance (starting + transactions)
GET/POST   /accounts/:id/transactions — list (paginated) / create transaction
POST       /accounts/:id/import      — bulk import (CSV parsed client-side, POSTed as JSON)
GET/POST   /categories               — list / create categories
GET        /merchant-rules           — per-tenant learned rules
PATCH      /transactions/:id         — update (confirm/correct category → updates rules)

GET        /budget                   — all rules + actuals for current period
POST       /starling/connect         — save Personal Access Token + kick off first sync
POST       /starling/sync            — manual sync trigger
GET        /starling/status          — connection status + last synced
```

---

### Auto-categorisation (no AI)

1. Transaction arrives (manual or Starling import)
2. Normalize merchant: lowercase, strip `Ltd/Limited/UK/PLC`, trim
3. Look up `merchant_rules` for this tenant — exact match first, then substring scan
4. Assign suggested category (`category_confirmed = false`)
5. User confirms → `category_confirmed = true`, increment `match_count` on rule
6. User corrects → upsert rule with new category, `match_count = 1`
7. Starling's own `spendingCategory` field used as fallback for first-time merchants (mapped to system categories)

Over time the rule table becomes a perfect per-tenant merchant memory.

---

### `packages/habits` components

- **HabitCard** — habit name, today's progress bar, streak badge, quick-log button
- **HabitLogForm** — quick-add modal (value + optional note, date defaults today)
- **StreakBadge** — flame icon + count, per frequency
- **TargetRing** — circular progress for a single time-scale target
- **RewardCard** — reward name, condition, status (locked/earned/redeemed)
- **PointsWidget** — current balance, recent earned/spent
- **AccountCard** — account name, current balance, last synced
- **TransactionRow** — amount, merchant, category pill (tappable to correct), date
- **TransactionForm** — quick-add: amount (in/out toggle), category, description, date (defaults today)
- **BudgetProgress** — category, spent vs limit, progress bar, over/under indicator
- **LifestyleDashboard** — today tab (habits due + points + recent transactions), finance tab

---

### `apps/habits` pages (port 3005)

- `/` — today dashboard: habits due, streak summary, points balance, recent transactions
- `/habits` — full habit list + manage targets
- `/log` — quick-log screen (one tap per habit)
- `/rewards` — earned + available + redeemed
- `/finance` — accounts overview + recent transactions across all accounts
- `/finance/:accountId` — account detail + transaction history + running balance chart
- `/budget` — budget rules vs actuals, by category + period
- `/settings` — Starling connect, health ingest token + Shortcut instructions

---

### CMS integration

- **Lifestyle feed** (`/lifestyle`) — today's habit completion %, points balance, last 3 transactions, "Open Habits →"
- Shown in nav when habits app is installed
- Settings → Habits section (install/uninstall trigger)

---

### External integrations

| Integration | Purpose | Auth | Notes |
|---|---|---|---|
| Starling Bank API | Transaction sync, account balance, savings spaces | Personal Access Token | User generates at developer.starlingbank.com |
| Apple Health (via Shortcuts) | Daily step count | Secret token in URL | One-time Shortcut setup, instructions in app |

---

### Build sequence

1. DB schema + migration (9 tables)
2. Habits CRUD + logging + streak calculation
3. Points ledger + reward unlock logic (auto-fires on every log)
4. Finance: accounts + categories + transactions + budget rules
5. Merchant auto-categorisation (rule engine + learning)
6. CSV import (client-side parse → POST)
7. Starling Personal Access Token sync (scheduler integration)
8. Health ingest endpoint + Shortcut config generator
9. `packages/habits` — all components
10. `apps/habits` — all pages
11. CMS lifestyle feed page + nav + settings
12. `turbo build` clean

---

**Done when:** habits are being tracked with streaks → rewards unlock automatically → spending is being logged (manually + Starling sync) → categories are learning from corrections → budget progress is visible in the CMS lifestyle feed.

**COMPLETE.** All 9 tables migrated (migration 0006 — run manually after docker up). Full habits/limits/rewards/points system, finance tracker with merchant auto-categorisation, Starling Bank sync (Personal Access Token, 15-min scheduler), iPhone Steps webhook + Shortcut instructions in Settings, packages/habits, apps/habits (port 3005), CMS lifestyle feed + nav + settings. 15/15 build clean.

---

## Phase 12 — App Hub + Day Context

Solves two architectural questions: (1) how do apps communicate without requiring the CMS as orchestrator, and (2) how does a user switch between apps without a central launcher.

**Model:** Peer-to-peer between apps — no CMS dependency. Each app queries others' APIs directly. The CMS is a peer, not a hub.

**AppSwitcher:**
- `packages/hub` library: `AppSwitcher` (floating ⊞ button, bottom-right), `HubSettings` (URL config form), `getHubConfig`/`setHubConfig` (localStorage)
- Default apps: CMS (3001), Journal (3002), Music (3003), Maps (3004), Lifestyle (3005)
- Current app highlighted in panel; one-click navigation between apps
- Config stored in localStorage — configure once in CMS Settings → Connected Apps, works across all apps in same browser
- AppSwitcher added to all five apps: journal, spotify, maps, habits, CMS

**Day Context Panel:**
- Appears inside journal entries (for existing entries, not new ones)
- Shows a row of data pills for that day: habits completed, step count, spending total, journey count + distance, tracks played + artists
- Fetches from `/habits/day-summary`, `/maps/day-summary`, `/spotify/day-summary` using `credentials: 'include'` (shared auth cookie)
- Each summary endpoint checks which apps are enabled in hub config and shows only relevant pills
- Falls back gracefully — shows nothing if an app isn't installed or has no data for that day

**New API endpoints:**
- `GET /habits/day-summary?date=YYYY-MM-DD` → habitsCompleted, habitsTotal, stepCount, spendingTotal
- `GET /maps/day-summary?date=YYYY-MM-DD` → count, totalDistanceM, modes
- `GET /spotify/day-summary?date=YYYY-MM-DD` → trackCount, artists

**New DB query helpers:**
- `getHabitsDaySummary(db, tenantId, date)` — queries habit_logs + transactions
- `getJourneysDaySummary(db, tenantId, date)` — queries journeys by date
- `getSpotifyDaySummary(db, tenantId, date)` — parses recently_played cache by date
- `getJourneysByDate(db, tenantId, date)` — journeys for a specific calendar day

- [x] `packages/hub` — AppSwitcher, HubSettings, config (localStorage), types
- [x] Day summary endpoints on habits, maps, spotify routes
- [x] `getHabitsDaySummary`, `getJourneysDaySummary`, `getSpotifyDaySummary`, `getJourneysByDate` query helpers
- [x] `DayContextPanel` in `packages/journal`, wired into `JournalEditorPage`
- [x] AppSwitcher integrated into all five apps
- [x] HubSettings in CMS Settings → Connected Apps section

**Done when:** opening a journal entry for a day shows that day's habits, steps, spending, travel, and music as context pills. The floating ⊞ button on every app lets you jump between apps instantly.

**COMPLETE.** packages/hub (AppSwitcher, HubSettings, AppLoginScreen, config), day summary endpoints + query helpers, DayContextPanel in packages/journal, AppSwitcher on all 5 apps, HubSettings in CMS Settings → Connected Apps. 16/16 build clean.

---

## Phase 13 — CMS Editor Rebuild + Plugin Hub + Standalone Login + Site Config

Completes the CMS as a first-class publishing tool and makes every app fully standalone.

### Standalone login (complete)

Each app now has its own login screen via `AppLoginScreen` from `packages/hub` — no longer requires CMS to sign in. Same email = same account. Signup still happens in CMS or any standalone app (creates user + tenant, auto-installs that app).

- [x] `AppLoginScreen` component in packages/hub — shared login form, app-specific branding
- [x] All 4 standalone apps (journal, spotify, maps, habits) updated with own login screen
- [x] All 4 AuthContexts updated with `login`, `logout`, `refresh` methods

### Plugin hub page (complete)

Dedicated `/plugins` route in CMS replaces the scattered sections in Settings.

- [x] `apps/cms/src/pages/PluginsPage.tsx` — app cards with install/uninstall + inline config panels
- [x] `/plugins` route added to CMS routing
- [x] "Plugins" nav link added to AppShellLayout
- [x] Plugin-specific sections removed from SettingsPage (AppsSection, SpotifySection, MapsSection, HabitsSection)

### Block page editor (complete)

New pages use a structured block editor. Old HTML pages open in the legacy editor unchanged.

- [x] `BlockEditor` component — 6 block types: Heading (H1/H2/H3 + align), Text (TipTap), Image (url/alt/width/align + media picker), Divider (solid/dashed/dotted), Button (label/href/variant/align), Spacer (height)
- [x] @dnd-kit/core + @dnd-kit/sortable drag-and-drop block reordering
- [x] Per-block style controls inline
- [x] `PageEditorPage` updated — new pages use BlockEditor, existing HTML pages use legacy RichTextEditor
- [x] `PublicPageView` updated — renders blocks natively, falls back to HTML/text for legacy pages

### Code block (complete)

- [x] Code block type in BlockEditor — dark-themed textarea, language selector (TypeScript/JS/Python/Bash/SQL/JSON/HTML/CSS/Rust/Go/plaintext), renders as `<pre><code>` in public view

### AppSwitcher — show only installed apps (complete)

- [x] AppSwitcher accepts `apiBase` prop; fetches `/apps` to get installed slugs and filters hub config accordingly
- [x] Always shows CMS and current app regardless; falls back to localStorage if API unavailable
- [x] All 5 apps pass `apiBase={API_URL}` to AppSwitcher

### Account model + explicit app activation (complete)

- [x] Visiting an app with a valid session but that app not yet activated → `AppActivationScreen` prompt: "Activate [App] on your moducore account?"
- [x] One-click activation calls `POST /apps/:slug/install`; "Use a different account" triggers logout
- [x] Sign up on any standalone app creates user + tenant + auto-installs that app (`appSlug` param on `/auth/signup`)
- [x] Same email across apps = same account (shared users table)
- [x] `AppLoginScreen` signup mode added — name, email, password, workspace name/slug, auto-slugify

### Cross-app connect codes (complete)

- [x] `app_link_tokens` table — `grantingTenantId`, `appSlug`, `token` (6-char uppercase), `grantedToTenantId`, `expiresAt`, `grantedAt`
- [x] `POST /connect-codes/generate` — generates code, 15-min expiry, invalidates prior unused codes for same tenant+app
- [x] `POST /connect-codes/consume` — validates and links code to consuming tenant; rejects self-links and expired codes
- [x] `GET /connect-codes/links` — lists granted and received links
- [x] `ConnectCodesSection` in CMS Settings — generate code per app, consume input for received codes

### Site config — global + per-page (complete)

- [x] `site_configs` table: `siteName`, `logoUrl`, `accentColor`, `fontFamily`, `navLinks` (jsonb), `headerBlocks` (jsonb), `footerBlocks` (jsonb), unique per tenant
- [x] `style` jsonb column on `pages`: per-page overrides (accentColor, backgroundColor, fontFamily, maxWidth, showHeader, showFooter, showNav)
- [x] Migration 0007 (`site_configs`, `pages.style`, `app_link_tokens`)
- [x] `getSiteConfig` + `upsertSiteConfig` query helpers in `packages/db`
- [x] `GET/PATCH /site-config` (authenticated) + `GET /site-config/public/:tenantSlug` (public)
- [x] `/site` route in CMS — 4-tab editor: Branding (name/logo/accent/font with live preview), Navigation (nav links), Header (BlockEditor), Footer (BlockEditor)
- [x] Public pages wrapped in site shell — header blocks → nav bar (logo + links) → content → footer blocks; per-page overrides applied on top
- [x] Per-page style panel in PageEditorPage — accent colour, background colour, max-width, show/hide header/footer/nav toggles

### Landing app (complete)

- [x] `apps/home` (port 3006) — marketing/landing site, no auth required
- [x] Hero section with headline + "Start for free" CTA → CMS signup
- [x] App cards for moducore, Journal, Music, Travel, Lifestyle — icon, tagline, description, hover effect, "Get started" link
- [x] Env vars for each app URL with localhost defaults; sticky header with sign-in link
- [x] Standalone, no API dependency

---

**Done when:** every app has its own login screen, connect codes link apps across accounts, the CMS site editor controls global branding + nav + header/footer, and published pages render inside the configured site shell.

**COMPLETE.** Code block in BlockEditor, AppSwitcher reads from API, AppLoginScreen signup mode, AppActivationScreen, connect codes (generate/consume/links), site_configs table + migration 0007, site config editor (/site, 4 tabs), public page shell, per-page style panel, ConnectCodesSection in Settings, apps/home landing site (port 3006). 17/17 build clean.

---

## Phase 14 — Production Hardening (Security, Testing, Observability)

Portfolio-quality code that also passes a real senior engineering review. Addresses every gap identified in the Phase 13 audit. No new features — this phase makes what exists safe, observable, and verifiable.

Organised into five tracks that can be worked in parallel once the critical security items are done.

---

### Track A — Critical Security (do first)

**A1 — XSS: sanitize `dangerouslySetInnerHTML` in PublicPageView**
- `apps/cms/src/pages/PublicPageView.tsx` uses `dangerouslySetInnerHTML` on user-authored block HTML with no sanitization
- Install `dompurify` + `@types/dompurify`; wrap every `dangerouslySetInnerHTML` call with `DOMPurify.sanitize()`
- Apply the same fix to the legacy HTML content path (line ~95)
- [ ] Install dompurify
- [ ] Sanitize block.html in PublicPageView
- [ ] Sanitize legacy HTML content path

**A2 — Encrypt secrets stored in the database**
- `packages/db/src/schema/connectors.ts` has explicit `TODO: encrypt at application layer` comment
- `accounts` table stores `starlingAccessToken` as plaintext JSONB
- Implement AES-256-GCM encrypt/decrypt helpers in `packages/core/src/crypto.ts`
- Encrypt on write, decrypt on read in the relevant query helpers
- New env var: `ENCRYPTION_KEY` (32 random bytes, base64)
- [ ] AES-256-GCM helpers in packages/core
- [ ] Encrypt connector config on write, decrypt on read
- [ ] Encrypt starlingAccessToken on write, decrypt on read
- [ ] Add ENCRYPTION_KEY to .env.example and startup validation
- [ ] Remove the TODO comment (resolve, don't leave it)

**A3 — Fix silent error suppression in schedulers**
- `apps/api/src/lib/journey-detection.ts` — multiple `catch {}` blocks swallow errors silently
- `apps/api/src/routes/starling.ts` — Starling sync auth failures swallowed
- `apps/api/src/lib/tfl.ts` and `weather.ts` — external API failures invisible
- Replace silent catches with structured error logging (see Track D)
- Scheduler failures should: log the error with context, not crash the process, surface in a `lastError` field queryable via status endpoints
- [ ] journey-detection.ts — log errors with context
- [ ] starling sync — log auth failures, surface via /starling/status
- [ ] tfl.ts + weather.ts — log fetch failures, return null with error context

---

### Track B — Auth & Session Hardening

**B1 — Rate limiting on auth endpoints**
- Install `hono-rate-limiter` or equivalent (works with Hono middleware pattern)
- Apply to: `POST /auth/signup`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- Limits: 5 requests per 15 min per IP on login/forgot; 10 per hour on signup
- [ ] Install rate limiter package
- [ ] Apply to auth routes with appropriate windows

**B2 — Enforce session expiry at query time**
- `packages/db/src/queries/sessions.ts` — `getSessionByToken` must add `AND expires_at > NOW()` to the lookup
- Currently, an expired session token may still authenticate
- [ ] Update getSessionByToken query to filter expired sessions
- [ ] Add a periodic cleanup job (delete sessions older than 30 days) to the scheduler

**B3 — Stronger password requirements**
- `packages/core/src/schemas.ts` password schema: raise minimum to 12 chars, require at least one number and one special character
- Update error messages to be informative ("Password must be at least 12 characters and contain a number and symbol")
- Apply the updated schema to both signup and reset-password routes
- [ ] Update password Zod schema in packages/core
- [ ] Confirm both signup and reset routes use the shared schema

**B4 — Field-level authorization (per-user within tenant)**
- Journal entries, habit logs, transactions — any tenant member can currently edit/delete any other member's rows
- Routes that mutate a specific row should verify `createdBy = session.userId` (or `requireRole('admin')`)
- Affected routes: `PATCH/DELETE /journal/:id`, `PATCH/DELETE /habits/:id`, `PATCH /transactions/:id`
- [ ] journal.ts — add createdBy check on PATCH/DELETE
- [ ] habits.ts — add createdBy check on PATCH/DELETE
- [ ] transactions.ts — add createdBy check on PATCH

---

### Track C — API Quality

**C1 — Consistent API response envelope**
- Currently routes return `{ ok: true }`, bare resources, `{ error: 'msg' }`, or `{ data: [...] }` inconsistently
- Define a standard envelope in `packages/core/src/api.ts`:
  - Success: `{ data: T }` or `{ data: T, meta: { page, total } }` for lists
  - Error: `{ error: { code: string, message: string } }`
- Update all routes to use the envelope; update frontend API helpers to unwrap `.data`
- [ ] Define envelope types in packages/core
- [ ] Update all routes (pages, journal, habits, finance, maps, spotify, connectors, auth)
- [ ] Update frontend API fetch helpers to unwrap

**C2 — Validate external API responses with Zod**
- `apps/api/src/lib/tfl.ts`, `weather.ts`, `starling.ts` — responses assumed to have expected shape
- Write minimal Zod schemas for each external API response
- `.safeParse()` on fetch result; log + return null if invalid; never crash on malformed external data
- [ ] tfl.ts — Zod schema for journey planner + line status responses
- [ ] weather.ts — Zod schema for Open-Meteo response
- [ ] starling.ts — Zod schema for transactions + account response

**C3 — Environment variable validation at startup**
- `apps/api/src/index.ts` — add startup env validation before server starts
- Use Zod to parse `process.env` on boot; throw with a clear error listing all missing vars if any are absent
- Document all vars in `.env.example` with comments
- Required vars: `DATABASE_URL`, `SESSION_SECRET`, `ENCRYPTION_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `HABITS_HEALTH_SECRET`, `LOCATION_INGEST_SECRET`, optional: `TFL_APP_KEY`, `SPOTIFY_APP_URL`
- [ ] Zod env schema in apps/api/src/env.ts
- [ ] Import and validate at the top of index.ts (before server starts)
- [ ] Update .env.example with all vars + comments

**C4 — Database indexes for tenant-scoped queries**
- All tables queried with `WHERE tenant_id = ?` will full-scan as data grows
- Add indexes on hot paths: `(tenant_id)` on all main tables, `(tenant_id, status)` on pages/journal_entries, `(tenant_id, date)` on habit_logs/transactions/journeys, `(tenant_id, type)` on spotify_data_cache
- Add as a new migration (`0008_indexes.sql`)
- [ ] Generate migration with all indexes
- [ ] Run migration

**C5 — Unsafe media uploads (public without auth)**
- `/uploads/*` served as static files — anyone with the URL can access any uploaded file
- Add the file to a per-tenant subdirectory (`/uploads/:tenantId/:filename`) so URLs are harder to enumerate
- Gate `/uploads/:tenantId/*` behind tenant ownership check (or keep public but use unguessable UUIDs — they already use UUIDs, so document this as intentional)
- [ ] Confirm uploads use UUID filenames (already implemented)
- [ ] Move uploads into per-tenant subdirectory structure
- [ ] Update media routes + static serving path

---

### Track D — Observability & Logging

**D1 — Structured logging**
- Replace `console.log/error` throughout the API with a structured logger
- Install `pino` (fast, JSON output, works well with Node/Hono)
- Log levels: `info` for request lifecycle, `warn` for recoverable errors, `error` for failures
- Include: `level`, `msg`, `tenantId` (where available), `requestId`, `err` (on errors)
- Add request ID middleware (generates `x-request-id` per request, attaches to log context)
- [ ] Install pino + pino-pretty (dev)
- [ ] Create logger instance in apps/api/src/lib/logger.ts
- [ ] Replace console.log/error in routes, scheduler, and integration libs
- [ ] Add request ID middleware

**D2 — Status endpoints for integrations**
- Starling, Spotify, health ingest schedulers should expose `lastSyncAt`, `lastError`, `nextSyncAt` via their status endpoints
- `/starling/status`, `/spotify/status` already exist — enrich them with `lastError` field
- [ ] Add lastError tracking to scheduler jobs
- [ ] Expose via existing status endpoints

---

### Track E — Testing

**E1 — Integration tests for auth flow**
- The most critical path in the system — test it first
- Use `vitest` + Hono's test client (`app.request()`) + a test database (or transaction rollback pattern)
- Tests: signup creates user+tenant, login returns session cookie, `requireAuth` rejects unauthenticated requests, logout invalidates session, forgot-password + reset flow end-to-end
- [ ] Install vitest + @hono/testing
- [ ] Configure test database (separate `TEST_DATABASE_URL` or rollback fixture)
- [ ] Write auth integration tests (signup, login, logout, reset)

**E2 — Integration tests for core CRUD routes**
- Cover the most business-critical routes with happy-path + auth guard tests
- Pages: create, publish, fetch public; Journal: create, update, delete own entry, reject delete of other user's entry; Habits: log entry, check streak increments
- [ ] Pages CRUD + publish flow tests
- [ ] Journal CRUD + field-level auth tests
- [ ] Habits log + streak tests

**E3 — Unit tests for business logic**
- Pure functions with no I/O are easiest to test and most valuable for demonstrating skills
- Targets: `packages/core/src/schemas.ts` (Zod schema validation cases), merchant auto-categorisation rule engine, journey detection logic (split/merge algorithm), streak calculation logic, suggestion engine scoring function
- [ ] Schema validation unit tests (valid + invalid inputs)
- [ ] Merchant categorisation rule engine tests
- [ ] Journey detection split logic tests
- [ ] Streak calculation tests
- [ ] Suggestion engine scoring tests

**E4 — Set up CI with GitHub Actions**
- `.github/workflows/ci.yml`: on push/PR to main — install deps, run `turbo build`, run `turbo test`
- Add build status badge to README
- [ ] .github/workflows/ci.yml (install, build, test)
- [ ] README badge

---

### Track F — Minor Polish

**F1 — Remove hardcoded constants**
- Session duration, token expiry, upload size limit, rate limit windows — all hardcoded in route files
- Move to a central `apps/api/src/config.ts` that reads from env with defaults
- [ ] Create apps/api/src/config.ts with all tuneable constants

**F2 — Share types properly between client and server**
- `apps/cms/src/lib/api.ts` duplicates types already in `packages/core`
- Audit and replace duplicates with imports from `@moducore/core`
- [ ] Audit cms/src/lib/api.ts for duplicated types
- [ ] Replace with imports from packages/core

**F3 — Global error boundary in CMS frontend**
- No React Error Boundary — an unhandled render error kills the whole app
- Add `ErrorBoundary` wrapper in `apps/cms/src/App.tsx`
- [ ] Add ErrorBoundary to CMS app root

**F4 — API documentation**
- Add a `docs/api.md` with a table of every endpoint: method, path, auth required, request body, response shape
- Doubles as a reference for the portfolio — shows you can think about API contracts
- [ ] Write docs/api.md covering all routes

---

**Done when:** no plaintext secrets in DB, XSS fixed, rate limiting on auth, session expiry enforced, all schedulers log errors, env validated at startup, DB indexed, 20+ tests passing in CI, structured logs, consistent API response shapes.

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
| Habits: limits naming | "Limits" not "punishments" | 2026-03 | Positive framing — you're setting a boundary, not punishing yourself. |
| Habits: reward model | Hybrid (points + condition unlocks) | 2026-03 | Some habits earn points (spent on any reward), others trigger specific unlocks (e.g. stay within takeaway limit → £50 shopping). |
| Habits: time scales | Multi-target per habit | 2026-03 | One habit can have daily + weekly + monthly + yearly targets simultaneously. Log once, checked against all scales. |
| Starling auth | Personal Access Token | 2026-03 | Personal tool — user generates token in Starling dev portal, pastes in Settings. No central app registration needed. |
| Transaction categorisation | Rule-based learning (no AI) | 2026-03 | Merchant name → category rules per tenant, learned from user corrections. Starling's own category codes bootstrap first-time merchants. Gets accurate fast without any ML. |
| Finance scope | Inside habits app, not separate | 2026-03 | Lifestyle and money are inseparable — one app, two tabs. Cleaner UX than a separate finance app. |
| App launcher | AppSwitcher widget in every app (packages/hub) | 2026-03 | Apps sell independently — no central launcher required. Floating ⊞ button in each app; config in localStorage. CMS is a peer, not a hub. |
| Day context | Journal queries other apps' APIs directly (peer-to-peer) | 2026-03 | Works without CMS. Journal's DayContextPanel calls /habits/day-summary, /maps/day-summary, /spotify/day-summary using shared session cookie. |
| Plugin hub | Dedicated /plugins page in CMS, not Settings sections | 2026-03 | Cleaner UX — install/configure in one place. Settings keeps workspace, embeds, connectors only. |
| Block editor migration | New pages only, existing pages untouched | 2026-03 | "Start clean" — no migration of old HTML content. Legacy editor still used for old pages. |
| Account model | Email = identity across all apps; same email = same account | 2026-03 | One user table shared. Sign up on any app creates user + tenant. Same email on another app links to existing account. No per-app passwords. |
| App activation | Explicit opt-in prompt when visiting app with existing session | 2026-03 | Shared cookie silently logged you in — too invisible. Show prompt so user intentionally connects the app to their account. |
| Cross-app data auth | Connect codes (short-lived tokens) | 2026-03 | More deliberate than silent shared cookie. User generates code in source app, pastes in target. Feels like a real integration. |
| Site config | Global defaults + per-page overrides | 2026-03 | Global: header/footer/nav/palette. Per-page: can override any global style and show/hide shell. |
| Landing site | apps/home (port 3006), static, no auth | 2026-03 | Marketing entry point for all apps. Standalone — no API dependency. |
