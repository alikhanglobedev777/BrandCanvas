ALTER TABLE "store_settings" ADD COLUMN "business_address" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "store_policies" text;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "default_currency" varchar(3) DEFAULT 'PKR' NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_currency_format" CHECK ("store_settings"."default_currency" ~ '^[A-Z]{3}$');
