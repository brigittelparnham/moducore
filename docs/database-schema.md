# Database Schema

PostgreSQL. All tables use UUIDs as primary keys. All tenant-data tables include `tenant_id`.

Status: **Draft — subject to change as features are built**

---

## Conventions

- Primary keys: `uuid` generated with `gen_random_uuid()`
- Timestamps: `created_at`, `updated_at` on all tables (updated_at via trigger)
- Soft deletes: `deleted_at` nullable timestamp where data should be recoverable
- JSON data: `jsonb` for flexible/schema-flexible fields
- Tenant isolation: every data table has `tenant_id uuid NOT NULL REFERENCES tenants(id)`

---

## Core / Auth

### tenants
The top-level organizational unit. Each customer is a tenant.

```sql
CREATE TABLE tenants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,   -- used in subdomain: slug.yourplatform.com
  plan         text NOT NULL DEFAULT 'free',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
```

### users
Individual people. A user belongs to one or more tenants via `tenant_members`.

```sql
CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text NOT NULL UNIQUE,
  password_hash  text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);
```

### tenant_members
Join table — which users belong to which tenants and at what role.

```sql
CREATE TABLE tenant_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  user_id     uuid NOT NULL REFERENCES users(id),
  role        text NOT NULL DEFAULT 'member',  -- owner | admin | member
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
```

### sessions
Auth sessions managed by better-auth. Store server-side for revocability.

```sql
CREATE TABLE sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  token       text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

### embed_tokens
Tokens for external embeds. Scoped to a tenant, optional app, and permission set.

```sql
CREATE TABLE embed_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  name         text NOT NULL,            -- human label e.g. "My Notion embed"
  token        text NOT NULL UNIQUE,     -- the actual secret sent with requests
  app_slug     text,                     -- null = all apps, or 'journal' | 'cms' etc
  permissions  jsonb NOT NULL DEFAULT '{"read": true, "write": false}',
  expires_at   timestamptz,              -- null = no expiry
  created_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at   timestamptz
);
```

---

## App Registry

### apps
Registry of available apps on the platform.

```sql
CREATE TABLE apps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,   -- 'cms' | 'journal' | etc
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

### tenant_apps
Which apps a tenant has installed and their configuration.

```sql
CREATE TABLE tenant_apps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  app_slug     text NOT NULL,
  config       jsonb NOT NULL DEFAULT '{}',   -- app-specific settings
  enabled      boolean NOT NULL DEFAULT true,
  installed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, app_slug)
);
```

---

## CMS

### pages
CMS pages with flexible JSON content (block-based editor output).

```sql
CREATE TABLE pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  title        text NOT NULL,
  slug         text NOT NULL,
  content      jsonb NOT NULL DEFAULT '{}',   -- block editor output
  status       text NOT NULL DEFAULT 'draft', -- draft | published
  published_at timestamptz,
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  UNIQUE (tenant_id, slug)
);
```

### media
Uploaded files referenced by CMS content.

```sql
CREATE TABLE media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  filename    text NOT NULL,
  url         text NOT NULL,
  mime_type   text NOT NULL,
  size_bytes  integer NOT NULL,
  uploaded_by uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
```

---

## Journal

### journal_entries

```sql
CREATE TABLE journal_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  title        text,
  content      jsonb NOT NULL DEFAULT '{}',   -- block editor output
  tags         text[] NOT NULL DEFAULT '{}',
  status       text NOT NULL DEFAULT 'draft', -- draft | published | private
  published_at timestamptz,
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
```

---

## Integrations / Connectors

### connectors
External API connections configured per tenant.

```sql
CREATE TABLE connectors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  type        text NOT NULL,             -- 'hospitality' | 'rss' | 'shopify' | etc
  name        text NOT NULL,             -- human label
  config      jsonb NOT NULL DEFAULT '{}',  -- API keys, endpoints (encrypted at app layer)
  enabled     boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### connector_data_cache
Cached data fetched from external APIs.

```sql
CREATE TABLE connector_data_cache (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id uuid NOT NULL REFERENCES connectors(id),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  data         jsonb NOT NULL,
  fetched_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz
);
```

---

## Indexes

```sql
-- Tenant isolation — on every tenant_id column
CREATE INDEX ON tenant_members (tenant_id);
CREATE INDEX ON sessions (user_id);
CREATE INDEX ON sessions (token);
CREATE INDEX ON embed_tokens (token);
CREATE INDEX ON embed_tokens (tenant_id);
CREATE INDEX ON tenant_apps (tenant_id);
CREATE INDEX ON pages (tenant_id);
CREATE INDEX ON pages (tenant_id, slug);
CREATE INDEX ON journal_entries (tenant_id);
CREATE INDEX ON journal_entries (tenant_id, status);
CREATE INDEX ON connectors (tenant_id);
CREATE INDEX ON connector_data_cache (connector_id);
CREATE INDEX ON connector_data_cache (tenant_id);
```

---

## Notes / Open Questions

- `content` fields use `jsonb` to support a block-based editor (e.g. TipTap, BlockNote). Schema of the JSON is determined by the editor choice.
- Connector `config` contains API credentials — these must be encrypted at the application layer before storage. Do not store plaintext API keys.
- `tags` on journal entries uses a Postgres `text[]` array. If querying by tag becomes complex, promote to a `tags` table with a join.
- Write-back from embeds: embed tokens with `"write": true` in permissions allow POST requests. The API validates the token and scopes writes to the token's `tenant_id`.
- Future: `pages` and `journal_entries` may need a `parent_id` for nesting/hierarchy.
