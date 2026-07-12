CREATE TYPE "public"."store_theme_header_style" AS ENUM('solid', 'minimal');--> statement-breakpoint
CREATE TYPE "public"."store_theme_footer_style" AS ENUM('simple', 'columns');--> statement-breakpoint
CREATE TYPE "public"."store_theme_product_card_style" AS ENUM('minimal', 'bordered', 'elevated');--> statement-breakpoint
ALTER TABLE "store_theme_configurations" ADD COLUMN "header_style" "store_theme_header_style" DEFAULT 'solid' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_theme_configurations" ADD COLUMN "button_radius" integer DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_theme_configurations" ADD COLUMN "card_radius" integer DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE "store_theme_configurations" ADD COLUMN "product_card_style" "store_theme_product_card_style" DEFAULT 'bordered' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_theme_configurations" ADD COLUMN "footer_style" "store_theme_footer_style" DEFAULT 'simple' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_theme_configurations" ADD CONSTRAINT "store_theme_button_radius_range" CHECK ("store_theme_configurations"."button_radius" between 0 and 32);--> statement-breakpoint
ALTER TABLE "store_theme_configurations" ADD CONSTRAINT "store_theme_card_radius_range" CHECK ("store_theme_configurations"."card_radius" between 0 and 32);
