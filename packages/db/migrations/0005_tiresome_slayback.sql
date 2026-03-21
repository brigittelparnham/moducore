CREATE TABLE IF NOT EXISTS "journeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"origin_lat" real NOT NULL,
	"origin_lon" real NOT NULL,
	"dest_lat" real NOT NULL,
	"dest_lon" real NOT NULL,
	"origin_name" text,
	"dest_name" text,
	"distance_m" integer NOT NULL,
	"duration_s" integer NOT NULL,
	"mode" text DEFAULT 'unknown' NOT NULL,
	"route_id" uuid,
	"tfl_estimated_s" integer,
	"tfl_route" jsonb,
	"weather_summary" jsonb,
	"ping_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "known_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"lat" real NOT NULL,
	"lon" real NOT NULL,
	"radius_m" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "known_places_tenant_id_name_unique" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "known_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"origin_lat" real NOT NULL,
	"origin_lon" real NOT NULL,
	"dest_lat" real NOT NULL,
	"dest_lon" real NOT NULL,
	"typical_duration_s" integer,
	"personal_ratio" real,
	"journey_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "location_pings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lat" real NOT NULL,
	"lon" real NOT NULL,
	"accuracy_m" real,
	"velocity_ms" real,
	"altitude_m" real,
	"battery_pct" integer,
	"recorded_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "spotify_connections" ADD COLUMN "redirect_uri" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journeys" ADD CONSTRAINT "journeys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "journeys" ADD CONSTRAINT "journeys_route_id_known_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."known_routes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "known_places" ADD CONSTRAINT "known_places_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "known_routes" ADD CONSTRAINT "known_routes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "location_pings" ADD CONSTRAINT "location_pings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
