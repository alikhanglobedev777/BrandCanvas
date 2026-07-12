CREATE TYPE "public"."category_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."collection_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "collection_products" (
	"collection_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_products_sort_order_nonnegative" CHECK ("collection_products"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"description" text,
	"status" "collection_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collections_sort_order_nonnegative" CHECK ("collections"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"description" text,
	"image_asset_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "category_status" DEFAULT 'active' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_categories_sort_order_nonnegative" CHECK ("product_categories"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"option_id" uuid NOT NULL,
	"value" varchar(100) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_option_values_position_nonnegative" CHECK ("product_option_values"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_options_position_nonnegative" CHECK ("product_options"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_variant_values" (
	"variant_id" uuid NOT NULL,
	"option_value_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "title" varchar(180) DEFAULT 'Default' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "barcode" varchar(100);--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "price_override_minor" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "compare_at_price_minor" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "cost_price_minor" integer;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price_minor" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "compare_at_price_minor" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_price_minor" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "barcode" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "keywords" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
UPDATE "product_variants"
SET "title" = "name",
    "price_override_minor" = round("price" * 100)::integer,
    "compare_at_price_minor" = CASE WHEN "compare_at_price" IS NULL THEN NULL ELSE round("compare_at_price" * 100)::integer END;--> statement-breakpoint
UPDATE "products" AS p
SET "price_minor" = round(v."price" * 100)::integer,
    "compare_at_price_minor" = CASE WHEN v."compare_at_price" IS NULL THEN NULL ELSE round(v."compare_at_price" * 100)::integer END
FROM "product_variants" AS v
WHERE v."product_id" = p."id" AND v."is_default" = true;--> statement-breakpoint
ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_image_asset_id_store_assets_id_fk" FOREIGN KEY ("image_asset_id") REFERENCES "public"."store_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_id_product_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."product_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_option_value_id_product_option_values_id_fk" FOREIGN KEY ("option_value_id") REFERENCES "public"."product_option_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collection_products_unique" ON "collection_products" USING btree ("collection_id","product_id");--> statement-breakpoint
CREATE INDEX "collection_products_product_idx" ON "collection_products" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collections_store_slug_unique" ON "collections" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "collections_store_status_idx" ON "collections" USING btree ("store_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_store_slug_unique" ON "product_categories" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "product_categories_store_status_idx" ON "product_categories" USING btree ("store_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "product_option_values_option_value_unique" ON "product_option_values" USING btree ("option_id","value");--> statement-breakpoint
CREATE UNIQUE INDEX "product_option_values_option_position_unique" ON "product_option_values" USING btree ("option_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "product_options_product_name_unique" ON "product_options" USING btree ("product_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_options_product_position_unique" ON "product_options" USING btree ("product_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_values_unique" ON "product_variant_values" USING btree ("variant_id","option_value_id");--> statement-breakpoint
CREATE INDEX "product_variant_values_option_value_idx" ON "product_variant_values" USING btree ("option_value_id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_store_category_idx" ON "products" USING btree ("store_id","category_id");--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_price_override_nonnegative" CHECK ("product_variants"."price_override_minor" is null or "product_variants"."price_override_minor" >= 0);--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_compare_at_price_valid" CHECK ("product_variants"."compare_at_price_minor" is null or "product_variants"."compare_at_price_minor" >= coalesce("product_variants"."price_override_minor", 0));--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_cost_price_nonnegative" CHECK ("product_variants"."cost_price_minor" is null or "product_variants"."cost_price_minor" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_minor_nonnegative" CHECK ("products"."price_minor" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_compare_at_price_valid" CHECK ("products"."compare_at_price_minor" is null or "products"."compare_at_price_minor" >= "products"."price_minor");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_cost_price_nonnegative" CHECK ("products"."cost_price_minor" is null or "products"."cost_price_minor" >= 0);
