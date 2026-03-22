# moducore API Reference

Base URL: `http://localhost:3000` (dev) — set via `VITE_API_URL` in each frontend app.

All authenticated routes require a valid session cookie (`moducore_session`).
Role hierarchy: `owner > admin > member`.

---

## Auth · `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/signup` | — | Create tenant + owner account. Rate-limited (5/hr/IP). |
| `POST` | `/auth/login` | — | Authenticate and set session cookie. Rate-limited (10/15 min/IP). |
| `POST` | `/auth/logout` | — | Clear session cookie. |
| `GET`  | `/auth/me` | ✓ | Return current user, tenant, and member info. |
| `POST` | `/auth/forgot-password` | — | Send password-reset email. Rate-limited (10/15 min/IP). |
| `POST` | `/auth/reset-password` | — | Exchange reset token for new password. Rate-limited. |

---

## Pages · `/pages`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/pages` | — | List all pages for the tenant. |
| `GET`    | `/pages/:id` | — | Get a single page. |
| `POST`   | `/pages` | member | Create a page. |
| `PATCH`  | `/pages/:id` | member | Update title, slug, or content. |
| `POST`   | `/pages/:id/publish` | member | Publish a page. |
| `POST`   | `/pages/:id/unpublish` | member | Unpublish a page. |
| `DELETE` | `/pages/:id` | admin | Delete a page. |

### Public page rendering · `/public`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/public/:tenantSlug/pages/:slug` | — | Render a published page by tenant slug + page slug. |

---

## Journal · `/journal`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/journal` | — | List journal entries (public/published or all for tenant). |
| `GET`    | `/journal/:id` | — | Get a single entry. |
| `POST`   | `/journal` | member | Create an entry. |
| `PATCH`  | `/journal/:id` | member | Update an entry. |
| `POST`   | `/journal/:id/publish` | member | Publish an entry. |
| `POST`   | `/journal/:id/unpublish` | member | Unpublish an entry. |
| `DELETE` | `/journal/:id` | member | Delete an entry. |

---

## Media · `/media`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/media` | — | List media items for the tenant. |
| `POST`   | `/media` | member | Upload a file (multipart/form-data). Max 10 MB (configurable). |
| `DELETE` | `/media/:id` | member | Soft-delete a media item and remove the file from disk. |

Uploaded files served at `/uploads/:tenantId/<filename>`.

---

## Apps · `/apps`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/apps` | — | List available apps with installation status. |
| `POST`   | `/apps/:slug/install` | owner | Install an app for the tenant. |
| `DELETE` | `/apps/:slug/install` | owner | Uninstall an app. |

---

## Embed Tokens · `/embed-tokens`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/embed-tokens` | ✓ | List embed tokens for the tenant. |
| `POST`   | `/embed-tokens` | ✓ | Create a new embed token. |
| `DELETE` | `/embed-tokens/:id` | ✓ | Revoke an embed token. |

### Embed API · `/embed` (token-authenticated)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/embed/pages` | List published pages (embed token required). |
| `GET` | `/embed/pages/:slug` | Get a published page. |
| `GET` | `/embed/journal` | List published journal entries. |
| `GET` | `/embed/journal/:id` | Get a published journal entry. |
| `GET` | `/embed/spotify/now-playing` | Current or last-played track. |
| `GET` | `/embed/spotify/top-tracks` | Top tracks. |
| `GET` | `/embed/spotify/genres` | Top genres. |

---

## Connectors · `/connectors`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/connectors` | ✓ | List all connectors for the tenant. |
| `GET`    | `/connectors/:id` | ✓ | Get a single connector. |
| `POST`   | `/connectors` | ✓ | Create a connector (type: `rss` or `rest`). |
| `PATCH`  | `/connectors/:id` | ✓ | Update name, config, or enabled flag. |
| `DELETE` | `/connectors/:id` | ✓ | Delete a connector. |
| `POST`   | `/connectors/:id/sync` | ✓ | Trigger an immediate sync. |
| `GET`    | `/connectors/:id/data` | ✓ | Get the latest cached data for a connector. |

---

## Tenants · `/tenants`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`   | `/tenants/current` | ✓ | Get current tenant settings. |
| `PATCH` | `/tenants/current` | ✓ | Update tenant name or slug. |

---

## Site Config · `/site-config`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`   | `/site-config` | ✓ | Get tenant site config (logo, colours, nav). |
| `GET`   | `/site-config/public/:tenantSlug` | — | Public site config for embed/render. |
| `PATCH` | `/site-config` | ✓ | Update site config. |

---

## Spotify · `/spotify`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/spotify/status` | ✓ | OAuth status + last sync info. |
| `GET`    | `/spotify/connect` | ✓ | Redirect to Spotify OAuth consent screen. |
| `GET`    | `/spotify/callback` | — | OAuth callback — exchanges code, stores tokens. |
| `POST`   | `/spotify/credentials` | ✓ | Save Spotify app credentials (client ID + secret). |
| `DELETE` | `/spotify/credentials` | ✓ | Disconnect Spotify. |
| `POST`   | `/spotify/sync` | ✓ | Trigger an immediate Spotify sync. |
| `GET`    | `/spotify/now-playing` | ✓ | Current or last-played track from cache. |
| `GET`    | `/spotify/data/:type` | ✓ | Raw cached data by type (e.g. `recently_played`, `top_tracks_short`). |
| `GET`    | `/spotify/day-summary` | ✓ | Music summary for a given `?date=YYYY-MM-DD`. |

---

## Starling Bank · `/starling`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/starling/status` | ✓ | Connection status + last sync info. |
| `POST` | `/starling/credentials` | ✓ | Save Starling Personal Access Token. |
| `POST` | `/starling/sync` | ✓ | Trigger an immediate sync. |

---

## Maps & Commute · `/maps`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST`   | `/maps/ingest` | secret | Ingest a location ping from OwnTracks (header: `x-ingest-secret`). |
| `GET`    | `/maps/journeys` | ✓ | List detected journeys (optional `?date=YYYY-MM-DD`). |
| `GET`    | `/maps/journeys/today` | ✓ | Today's journeys. |
| `GET`    | `/maps/journeys/:id` | ✓ | Get a single journey with pings. |
| `GET`    | `/maps/routes` | ✓ | List saved commute routes. |
| `POST`   | `/maps/routes` | ✓ | Save a commute route. |
| `GET`    | `/maps/places` | ✓ | List saved places. |
| `POST`   | `/maps/places` | ✓ | Save a place. |
| `DELETE` | `/maps/places/:id` | ✓ | Delete a saved place. |
| `GET`    | `/maps/suggestions` | ✓ | Get commute suggestions for today. |
| `GET`    | `/maps/day-summary` | ✓ | Travel summary for a given `?date=YYYY-MM-DD`. |

---

## Habits & Lifestyle · `/habits`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/habits` | ✓ | List habits for the tenant. |
| `GET`    | `/habits/:id` | ✓ | Get a single habit. |
| `POST`   | `/habits` | ✓ | Create a habit. |
| `PATCH`  | `/habits/:id` | ✓ | Update a habit. |
| `DELETE` | `/habits/:id` | ✓ | Delete a habit. |
| `GET`    | `/habits/:id/logs` | ✓ | List logs for a habit. |
| `POST`   | `/habits/:id/logs` | ✓ | Log a habit completion. |
| `PUT`    | `/habits/:id/targets/:frequency` | ✓ | Set a habit target. |
| `DELETE` | `/habits/:id/targets/:frequency` | ✓ | Remove a habit target. |
| `GET`    | `/habits/streaks` | ✓ | Current streaks for all habits. |
| `GET`    | `/habits/points` | ✓ | Points balance and history. |
| `GET`    | `/habits/rewards` | ✓ | Rewards catalogue. |
| `POST`   | `/habits/rewards/:id/redeem` | ✓ | Redeem a reward. |
| `POST`   | `/habits/health-ingest` | secret | Ingest step count from iPhone Shortcut (header: `x-health-secret`). |
| `GET`    | `/habits/day-summary` | ✓ | Steps/spending/habits summary for `?date=YYYY-MM-DD`. |

---

## Finance · `/finance`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`    | `/finance/accounts` | ✓ | List accounts. |
| `GET`    | `/finance/accounts/:id` | ✓ | Get account details. |
| `POST`   | `/finance/accounts` | ✓ | Create an account. |
| `GET`    | `/finance/transactions` | ✓ | List transactions (with filtering). |
| `GET`    | `/finance/accounts/:id/transactions` | ✓ | List transactions for one account. |
| `POST`   | `/finance/transactions` | ✓ | Create a transaction. |
| `PATCH`  | `/finance/transactions/:id` | ✓ | Update a transaction. |
| `GET`    | `/finance/categories` | ✓ | List merchant categories. |
| `POST`   | `/finance/categories` | ✓ | Create a category. |
| `PATCH`  | `/finance/categories/:id` | ✓ | Update a category. |
| `GET`    | `/finance/budget` | ✓ | List budget rules. |
| `POST`   | `/finance/budget` | ✓ | Create a budget rule. |
| `PUT`    | `/finance/budget/:id` | ✓ | Replace a budget rule. |
| `DELETE` | `/finance/budget/:id` | ✓ | Delete a budget rule. |

---

## Connect Codes · `/connect-codes`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/connect-codes/generate` | ✓ | Generate a short-lived cross-app connect code. |
| `POST` | `/connect-codes/exchange` | — | Exchange a connect code for a session (used by hub). |
| `GET`  | `/connect-codes/links` | ✓ | Get deep-link URLs for all installed apps. |

---

## Error format

All errors follow a consistent structure:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

Common error codes: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `BAD_REQUEST` (400), `CONFLICT` (409), `INTERNAL_ERROR` (500).

---

## Rate limits

| Limiter | Window | Max requests |
|---------|--------|--------------|
| Auth (login, forgot-password, reset-password) | 15 min | 10/IP |
| Signup | 1 hour | 5/IP |

Rate-limit headers follow the `RateLimit` draft-6 standard.
Override defaults with env vars: `AUTH_RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_WINDOW_MS`, `SIGNUP_RATE_LIMIT_MAX`, `SIGNUP_RATE_LIMIT_WINDOW_MS`.
