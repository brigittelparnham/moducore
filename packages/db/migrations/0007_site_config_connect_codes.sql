-- Phase 13: Site config, per-page styles, app connect codes

-- Site config (one per tenant)
CREATE TABLE "site_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "site_name" text,
  "logo_url" text,
  "accent_color" text NOT NULL DEFAULT '#111111',
  "font_family" text NOT NULL DEFAULT 'system-ui',
  "nav_links" jsonb NOT NULL DEFAULT '[]',
  "header_blocks" jsonb NOT NULL DEFAULT '[]',
  "footer_blocks" jsonb NOT NULL DEFAULT '[]',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "site_configs_tenant_id_unique" UNIQUE("tenant_id")
);

-- Per-page style overrides
ALTER TABLE "pages" ADD COLUMN "style" jsonb;

-- App connect codes (for cross-app data linking)
CREATE TABLE "app_link_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "granting_tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "app_slug" text NOT NULL,
  "token" text NOT NULL,
  "granted_to_tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE,
  "expires_at" timestamp with time zone NOT NULL,
  "granted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "app_link_tokens_token_unique" UNIQUE("token")
);
