CREATE TYPE "public"."store_theme_font" AS ENUM('system_sans', 'system_serif', 'georgia', 'arial', 'verdana');--> statement-breakpoint
CREATE TYPE "public"."store_theme_header_layout" AS ENUM('logo_left', 'logo_centered');--> statement-breakpoint
CREATE TYPE "public"."store_theme_lifecycle" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "store_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"storage_provider" varchar(32) NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_assets_category_format" CHECK ("store_assets"."category" ~ '^[a-z][a-z0-9_]{0,49}$'),
	CONSTRAINT "store_assets_size_positive" CHECK ("store_assets"."size_bytes" > 0),
	CONSTRAINT "store_assets_width_positive" CHECK ("store_assets"."width" is null or "store_assets"."width" > 0),
	CONSTRAINT "store_assets_height_positive" CHECK ("store_assets"."height" is null or "store_assets"."height" > 0)
);
--> statement-breakpoint
CREATE TABLE "store_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"display_name" varchar(150) NOT NULL,
	"description" text,
	"contact_email" varchar(254),
	"contact_phone" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_theme_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"lifecycle" "store_theme_lifecycle" NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"published_version" integer,
	"primary_color" varchar(7) DEFAULT '#4F46E5' NOT NULL,
	"secondary_color" varchar(7) DEFAULT '#0F766E' NOT NULL,
	"background_color" varchar(7) DEFAULT '#FFFFFF' NOT NULL,
	"text_color" varchar(7) DEFAULT '#111827' NOT NULL,
	"heading_font" "store_theme_font" DEFAULT 'system_sans' NOT NULL,
	"body_font" "store_theme_font" DEFAULT 'system_sans' NOT NULL,
	"header_layout" "store_theme_header_layout" DEFAULT 'logo_left' NOT NULL,
	"header_sticky" boolean DEFAULT true NOT NULL,
	"header_show_logo" boolean DEFAULT true NOT NULL,
	"footer_show_contact" boolean DEFAULT true NOT NULL,
	"footer_text" varchar(200),
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_theme_revision_positive" CHECK ("store_theme_configurations"."revision" > 0),
	CONSTRAINT "store_theme_publication_state_valid" CHECK ((
        ("store_theme_configurations"."lifecycle" = 'draft' and "store_theme_configurations"."published_version" is null and "store_theme_configurations"."published_at" is null)
        or
        ("store_theme_configurations"."lifecycle" in ('published', 'archived') and "store_theme_configurations"."published_version" > 0 and "store_theme_configurations"."published_at" is not null)
      )),
	CONSTRAINT "store_theme_primary_color_hex" CHECK ("store_theme_configurations"."primary_color" ~ '^#[0-9A-Fa-f]{6}$'),
	CONSTRAINT "store_theme_secondary_color_hex" CHECK ("store_theme_configurations"."secondary_color" ~ '^#[0-9A-Fa-f]{6}$'),
	CONSTRAINT "store_theme_background_color_hex" CHECK ("store_theme_configurations"."background_color" ~ '^#[0-9A-Fa-f]{6}$'),
	CONSTRAINT "store_theme_text_color_hex" CHECK ("store_theme_configurations"."text_color" ~ '^#[0-9A-Fa-f]{6}$')
);
--> statement-breakpoint
ALTER TABLE "store_assets" ADD CONSTRAINT "store_assets_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_theme_configurations" ADD CONSTRAINT "store_theme_configurations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "store_assets_storage_key_unique" ON "store_assets" USING btree ("storage_provider","storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "store_assets_current_category_unique" ON "store_assets" USING btree ("store_id","category") WHERE "store_assets"."is_current" = true;--> statement-breakpoint
CREATE INDEX "store_assets_store_category_idx" ON "store_assets" USING btree ("store_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "store_settings_store_unique" ON "store_settings" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "store_theme_current_draft_unique" ON "store_theme_configurations" USING btree ("store_id") WHERE "store_theme_configurations"."lifecycle" = 'draft';--> statement-breakpoint
CREATE UNIQUE INDEX "store_theme_current_published_unique" ON "store_theme_configurations" USING btree ("store_id") WHERE "store_theme_configurations"."lifecycle" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "store_theme_published_version_unique" ON "store_theme_configurations" USING btree ("store_id","published_version");--> statement-breakpoint
CREATE INDEX "store_theme_history_idx" ON "store_theme_configurations" USING btree ("store_id","published_at");--> statement-breakpoint
INSERT INTO "store_settings" ("store_id", "display_name", "created_at", "updated_at")
SELECT "id", "name", "created_at", "updated_at"
FROM "stores";--> statement-breakpoint
INSERT INTO "store_theme_configurations" (
	"store_id",
	"lifecycle",
	"revision",
	"primary_color",
	"secondary_color",
	"background_color",
	"text_color",
	"created_at",
	"updated_at"
)
SELECT
	"id",
	'draft',
	1,
	CASE WHEN "theme"->>'primaryColor' ~ '^#[0-9A-Fa-f]{6}$' THEN "theme"->>'primaryColor' ELSE '#4F46E5' END,
	CASE WHEN "theme"->>'secondaryColor' ~ '^#[0-9A-Fa-f]{6}$' THEN "theme"->>'secondaryColor' ELSE '#0F766E' END,
	CASE WHEN "theme"->>'backgroundColor' ~ '^#[0-9A-Fa-f]{6}$' THEN "theme"->>'backgroundColor' ELSE '#FFFFFF' END,
	CASE WHEN "theme"->>'textColor' ~ '^#[0-9A-Fa-f]{6}$' THEN "theme"->>'textColor' ELSE '#111827' END,
	"created_at",
	"updated_at"
FROM "stores";--> statement-breakpoint
INSERT INTO "store_theme_configurations" (
	"store_id",
	"lifecycle",
	"revision",
	"published_version",
	"primary_color",
	"secondary_color",
	"background_color",
	"text_color",
	"published_at",
	"created_at",
	"updated_at"
)
SELECT
	"id",
	'published',
	1,
	1,
	CASE WHEN "theme"->>'primaryColor' ~ '^#[0-9A-Fa-f]{6}$' THEN "theme"->>'primaryColor' ELSE '#4F46E5' END,
	CASE WHEN "theme"->>'secondaryColor' ~ '^#[0-9A-Fa-f]{6}$' THEN "theme"->>'secondaryColor' ELSE '#0F766E' END,
	CASE WHEN "theme"->>'backgroundColor' ~ '^#[0-9A-Fa-f]{6}$' THEN "theme"->>'backgroundColor' ELSE '#FFFFFF' END,
	CASE WHEN "theme"->>'textColor' ~ '^#[0-9A-Fa-f]{6}$' THEN "theme"->>'textColor' ELSE '#111827' END,
	"updated_at",
	"created_at",
	"updated_at"
FROM "stores";
