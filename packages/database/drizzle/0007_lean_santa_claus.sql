CREATE TYPE "public"."inventory_reservation_status" AS ENUM('active', 'converted', 'released', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "inventory_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"inventory_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"status" "inventory_reservation_status" DEFAULT 'active' NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"reference_id" uuid NOT NULL,
	"idempotency_key" varchar(120) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_reservations_quantity_positive" CHECK ("inventory_reservations"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"storage_provider" varchar(32) NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt_text" varchar(250),
	"position" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_images_size_positive" CHECK ("product_images"."size_bytes" > 0),
	CONSTRAINT "product_images_width_positive" CHECK ("product_images"."width" > 0),
	CONSTRAINT "product_images_height_positive" CHECK ("product_images"."height" > 0),
	CONSTRAINT "product_images_position_nonnegative" CHECK ("product_images"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_store_variant_fk";
--> statement-breakpoint
ALTER TYPE "public"."inventory_movement_type" ADD VALUE IF NOT EXISTS 'set_quantity';--> statement-breakpoint
ALTER TYPE "public"."inventory_movement_type" ADD VALUE IF NOT EXISTS 'reservation_expiry';--> statement-breakpoint
ALTER TYPE "public"."inventory_movement_type" ADD VALUE IF NOT EXISTS 'cancellation_restore';--> statement-breakpoint
ALTER TYPE "public"."inventory_movement_type" ADD VALUE IF NOT EXISTS 'return_restore';--> statement-breakpoint
ALTER TYPE "public"."inventory_movement_type" ADD VALUE IF NOT EXISTS 'correction';--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "product_id" uuid;--> statement-breakpoint
UPDATE "inventory_items" AS ii
SET "product_id" = pv."product_id"
FROM "product_variants" AS pv
WHERE pv."id" = ii."variant_id"
  AND pv."store_id" = ii."store_id";--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "reserved_before" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "reserved_after" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "idempotency_key" varchar(120);--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
UPDATE "inventory_movements" AS im
SET "product_id" = ii."product_id",
    "variant_id" = ii."variant_id"
FROM "inventory_items" AS ii
WHERE ii."id" = im."inventory_item_id"
  AND ii."store_id" = im."store_id";--> statement-breakpoint
ALTER TABLE "inventory_movements" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_store_inventory_item_fk" FOREIGN KEY ("store_id","inventory_item_id") REFERENCES "public"."inventory_items"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_store_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_store_product_variant_fk" FOREIGN KEY ("store_id","product_id","variant_id") REFERENCES "public"."product_variants"("store_id","product_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_store_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_store_product_variant_fk" FOREIGN KEY ("store_id","product_id","variant_id") REFERENCES "public"."product_variants"("store_id","product_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_reservations_store_id_unique" ON "inventory_reservations" USING btree ("store_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_reservations_store_idempotency_unique" ON "inventory_reservations" USING btree ("store_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "inventory_reservations_store_status_expires_idx" ON "inventory_reservations" USING btree ("store_id","status","expires_at");--> statement-breakpoint
CREATE INDEX "inventory_reservations_reference_idx" ON "inventory_reservations" USING btree ("store_id","reference_type","reference_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_store_id_unique" ON "product_images" USING btree ("store_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_storage_key_unique" ON "product_images" USING btree ("storage_provider","storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_product_position_unique" ON "product_images" USING btree ("store_id","product_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_product_primary_unique" ON "product_images" USING btree ("store_id","product_id") WHERE "product_images"."is_primary" = true;--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("store_id","product_id","position");--> statement-breakpoint
CREATE INDEX "product_images_variant_idx" ON "product_images" USING btree ("store_id","variant_id");--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_store_variant_fk" FOREIGN KEY ("store_id","product_id","variant_id") REFERENCES "public"."product_variants"("store_id","product_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_store_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_store_product_variant_fk" FOREIGN KEY ("store_id","product_id","variant_id") REFERENCES "public"."product_variants"("store_id","product_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_movements_store_product_created_idx" ON "inventory_movements" USING btree ("store_id","product_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_movements_store_idempotency_unique" ON "inventory_movements" USING btree ("store_id","idempotency_key") WHERE "inventory_movements"."idempotency_key" is not null;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_stock_before_nonnegative" CHECK ("inventory_movements"."previous_quantity" >= 0);--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_stock_after_nonnegative" CHECK ("inventory_movements"."new_quantity" >= 0);--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_reserved_before_valid" CHECK ("inventory_movements"."reserved_before" >= 0 and "inventory_movements"."reserved_before" <= "inventory_movements"."previous_quantity");--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_reserved_after_valid" CHECK ("inventory_movements"."reserved_after" >= 0 and "inventory_movements"."reserved_after" <= "inventory_movements"."new_quantity");
--> statement-breakpoint
CREATE FUNCTION prevent_inventory_movement_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'inventory movements are immutable';
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER inventory_movements_immutable
BEFORE UPDATE OR DELETE ON "inventory_movements"
FOR EACH ROW EXECUTE FUNCTION prevent_inventory_movement_mutation();
