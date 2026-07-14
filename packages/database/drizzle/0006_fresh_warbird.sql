ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_price_nonnegative";--> statement-breakpoint
ALTER TABLE "collection_products" DROP CONSTRAINT "collection_products_collection_id_collections_id_fk";
--> statement-breakpoint
ALTER TABLE "collection_products" DROP CONSTRAINT "collection_products_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_variant_id_product_variants_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_inventory_item_id_inventory_items_id_fk";
--> statement-breakpoint
ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_image_asset_id_store_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "product_option_values" DROP CONSTRAINT "product_option_values_option_id_product_options_id_fk";
--> statement-breakpoint
ALTER TABLE "product_options" DROP CONSTRAINT "product_options_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "product_variant_values" DROP CONSTRAINT "product_variant_values_variant_id_product_variants_id_fk";
--> statement-breakpoint
ALTER TABLE "product_variant_values" DROP CONSTRAINT "product_variant_values_option_value_id_product_option_values_id_fk";
--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_category_id_product_categories_id_fk";
--> statement-breakpoint
DROP INDEX "collection_products_unique";--> statement-breakpoint
DROP INDEX "product_option_values_option_value_unique";--> statement-breakpoint
DROP INDEX "product_option_values_option_position_unique";--> statement-breakpoint
DROP INDEX "product_options_product_name_unique";--> statement-breakpoint
DROP INDEX "product_options_product_position_unique";--> statement-breakpoint
DROP INDEX "product_variant_values_unique";--> statement-breakpoint
ALTER TABLE "collection_products" ADD COLUMN "store_id" uuid;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD COLUMN "store_id" uuid;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "product_options" ADD COLUMN "store_id" uuid;--> statement-breakpoint
ALTER TABLE "product_variant_values" ADD COLUMN "store_id" uuid;--> statement-breakpoint
ALTER TABLE "product_variant_values" ADD COLUMN "product_id" uuid;--> statement-breakpoint
UPDATE "collection_products" AS cp
SET "store_id" = c."store_id"
FROM "collections" AS c
WHERE c."id" = cp."collection_id";--> statement-breakpoint
UPDATE "product_options" AS po
SET "store_id" = p."store_id"
FROM "products" AS p
WHERE p."id" = po."product_id";--> statement-breakpoint
UPDATE "product_option_values" AS pov
SET "store_id" = po."store_id",
    "product_id" = po."product_id"
FROM "product_options" AS po
WHERE po."id" = pov."option_id";--> statement-breakpoint
UPDATE "product_variant_values" AS pvv
SET "store_id" = pv."store_id",
    "product_id" = pv."product_id"
FROM "product_variants" AS pv
WHERE pv."id" = pvv."variant_id";--> statement-breakpoint
ALTER TABLE "collection_products" ALTER COLUMN "store_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_option_values" ALTER COLUMN "store_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_option_values" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_options" ALTER COLUMN "store_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variant_values" ALTER COLUMN "store_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variant_values" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "collections_store_id_unique" ON "collections" USING btree ("store_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_items_store_id_unique" ON "inventory_items" USING btree ("store_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_store_id_unique" ON "product_categories" USING btree ("store_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_option_values_store_product_id_unique" ON "product_option_values" USING btree ("store_id","product_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_options_store_product_id_unique" ON "product_options" USING btree ("store_id","product_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_store_id_unique" ON "product_variants" USING btree ("store_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_store_product_id_unique" ON "product_variants" USING btree ("store_id","product_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_store_id_unique" ON "products" USING btree ("store_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "store_assets_store_id_unique" ON "store_assets" USING btree ("store_id","id");--> statement-breakpoint
ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_store_collection_fk" FOREIGN KEY ("store_id","collection_id") REFERENCES "public"."collections"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_products" ADD CONSTRAINT "collection_products_store_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_store_variant_fk" FOREIGN KEY ("store_id","variant_id") REFERENCES "public"."product_variants"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_store_inventory_item_fk" FOREIGN KEY ("store_id","inventory_item_id") REFERENCES "public"."inventory_items"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_store_image_asset_fk" FOREIGN KEY ("store_id","image_asset_id") REFERENCES "public"."store_assets"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_store_product_option_fk" FOREIGN KEY ("store_id","product_id","option_id") REFERENCES "public"."product_options"("store_id","product_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_store_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_store_product_variant_fk" FOREIGN KEY ("store_id","product_id","variant_id") REFERENCES "public"."product_variants"("store_id","product_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant_values" ADD CONSTRAINT "product_variant_values_store_product_option_value_fk" FOREIGN KEY ("store_id","product_id","option_value_id") REFERENCES "public"."product_option_values"("store_id","product_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_store_product_fk" FOREIGN KEY ("store_id","product_id") REFERENCES "public"."products"("store_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_category_fk" FOREIGN KEY ("store_id","category_id") REFERENCES "public"."product_categories"("store_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collection_products_unique" ON "collection_products" USING btree ("store_id","collection_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_option_values_option_value_unique" ON "product_option_values" USING btree ("store_id","option_id","value");--> statement-breakpoint
CREATE UNIQUE INDEX "product_option_values_option_position_unique" ON "product_option_values" USING btree ("store_id","option_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "product_options_product_name_unique" ON "product_options" USING btree ("store_id","product_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "product_options_product_position_unique" ON "product_options" USING btree ("store_id","product_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_values_unique" ON "product_variant_values" USING btree ("store_id","variant_id","option_value_id");--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "compare_at_price";
