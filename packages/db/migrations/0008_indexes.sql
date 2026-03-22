-- ─── Phase 14 C4: Performance indexes for tenant-scoped queries ───────────────
-- Every high-frequency query filters by tenant_id first; adding compound
-- indexes eliminates full-table scans as data grows per tenant.

-- ── Core content ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pages_tenant               ON pages (tenant_id);
CREATE INDEX IF NOT EXISTS idx_pages_tenant_status        ON pages (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_pages_tenant_slug          ON pages (tenant_id, slug);

CREATE INDEX IF NOT EXISTS idx_media_tenant               ON media (tenant_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant     ON journal_entries (tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_status ON journal_entries (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant_date   ON journal_entries (tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_by    ON journal_entries (tenant_id, created_by);

-- ── Auth & sessions ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sessions_user              ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires           ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_embed_tokens_tenant        ON embed_tokens (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user        ON tenant_members (user_id);

-- ── Connectors ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_connectors_tenant          ON connectors (tenant_id);
CREATE INDEX IF NOT EXISTS idx_connector_cache_tenant     ON connector_data_cache (tenant_id);
CREATE INDEX IF NOT EXISTS idx_connector_cache_connector  ON connector_data_cache (connector_id);

-- ── Spotify ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_spotify_connections_tenant ON spotify_connections (tenant_id);
CREATE INDEX IF NOT EXISTS idx_spotify_cache_tenant       ON spotify_data_cache (tenant_id);
CREATE INDEX IF NOT EXISTS idx_spotify_cache_tenant_type  ON spotify_data_cache (tenant_id, type);

-- ── Maps / location ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_journeys_tenant            ON journeys (tenant_id);
CREATE INDEX IF NOT EXISTS idx_journeys_tenant_date       ON journeys (tenant_id, started_at);
CREATE INDEX IF NOT EXISTS idx_location_pings_tenant      ON location_pings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_location_pings_tenant_time ON location_pings (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_known_places_tenant        ON known_places (tenant_id);
CREATE INDEX IF NOT EXISTS idx_known_routes_tenant        ON known_routes (tenant_id);

-- ── Habits & lifestyle ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_habits_tenant              ON habits (tenant_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_tenant          ON habit_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_tenant_date     ON habit_logs (tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit           ON habit_logs (habit_id);
CREATE INDEX IF NOT EXISTS idx_rewards_tenant             ON rewards (tenant_id);
CREATE INDEX IF NOT EXISTS idx_points_balance_tenant      ON points_balance (tenant_id);

-- ── Finance ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_accounts_tenant            ON accounts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant          ON categories (tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant        ON transactions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_date   ON transactions (tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_account       ON transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category      ON transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_merchant_rules_tenant      ON merchant_rules (tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_rules_tenant        ON budget_rules (tenant_id);
