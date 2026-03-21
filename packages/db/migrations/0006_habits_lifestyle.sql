-- Phase 11: Habits & Lifestyle Tracker

-- habits
CREATE TABLE "habits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "icon" text,
  "color" text DEFAULT '#6366f1',
  "unit" text NOT NULL DEFAULT 'times',
  "unit_label" text,
  "type" text NOT NULL DEFAULT 'habit',
  "points_per_log" numeric DEFAULT '0',
  "notes" text,
  "archived" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- habit_targets (multi-frequency targets per habit)
CREATE TABLE "habit_targets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "habit_id" uuid NOT NULL REFERENCES "habits"("id") ON DELETE CASCADE,
  "frequency" text NOT NULL,
  "target_value" numeric NOT NULL,
  "target_type" text NOT NULL DEFAULT 'min',
  UNIQUE("habit_id", "frequency")
);

-- habit_logs
CREATE TABLE "habit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "habit_id" uuid NOT NULL REFERENCES "habits"("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "value" numeric NOT NULL DEFAULT '1',
  "logged_at" timestamptz NOT NULL DEFAULT now(),
  "source" text NOT NULL DEFAULT 'manual',
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- rewards
CREATE TABLE "rewards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "monetary_value" numeric,
  "reward_type" text NOT NULL,
  "points_cost" integer,
  "condition_habit_id" uuid REFERENCES "habits"("id") ON DELETE SET NULL,
  "condition_frequency" text,
  "earned_at" timestamptz,
  "redeemed_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- points_balance (ledger)
CREATE TABLE "points_balance" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "delta" integer NOT NULL,
  "reason" text NOT NULL,
  "ref_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- accounts
CREATE TABLE "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "type" text NOT NULL DEFAULT 'current',
  "currency" text NOT NULL DEFAULT 'GBP',
  "starting_balance" numeric NOT NULL DEFAULT '0',
  "starting_balance_date" date NOT NULL,
  "color" text DEFAULT '#6366f1',
  "provider" text NOT NULL DEFAULT 'manual',
  "starling_account_uid" text,
  "starling_access_token" text,
  "starling_last_synced_at" timestamptz,
  "archived" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- categories
CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "icon" text,
  "color" text DEFAULT '#6366f1',
  "type" text NOT NULL DEFAULT 'expense',
  "linked_habit_id" uuid REFERENCES "habits"("id") ON DELETE SET NULL,
  "is_system" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- merchant_rules (learned auto-categorisation)
CREATE TABLE "merchant_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "merchant_pattern" text NOT NULL,
  "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "match_count" integer NOT NULL DEFAULT 1,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("tenant_id", "merchant_pattern")
);

-- transactions
CREATE TABLE "transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "amount" numeric NOT NULL,
  "description" text NOT NULL,
  "merchant" text,
  "category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
  "category_confirmed" boolean NOT NULL DEFAULT false,
  "date" date NOT NULL,
  "notes" text,
  "source" text NOT NULL DEFAULT 'manual',
  "external_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("account_id", "external_id")
);

-- budget_rules
CREATE TABLE "budget_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "period" text NOT NULL,
  "limit_amount" numeric NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("tenant_id", "category_id", "period")
);

-- Indexes
CREATE INDEX "habit_logs_habit_id_logged_at_idx" ON "habit_logs"("habit_id", "logged_at");
CREATE INDEX "habit_logs_tenant_id_logged_at_idx" ON "habit_logs"("tenant_id", "logged_at");
CREATE INDEX "transactions_account_id_date_idx" ON "transactions"("account_id", "date");
CREATE INDEX "transactions_tenant_id_date_idx" ON "transactions"("tenant_id", "date");
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");
