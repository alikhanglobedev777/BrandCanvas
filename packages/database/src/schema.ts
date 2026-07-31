import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const platformRoleEnum = pgEnum("platform_role", [
  "super_admin",
  "user",
]);
export const userStatusEnum = pgEnum("user_status", ["active", "blocked"]);
export const customerStatusEnum = pgEnum("customer_status", ["active", "blocked"]);
export const customerTokenTypeEnum = pgEnum("customer_token_type", ["email_verification", "password_reset"]);
export const customDomainVerificationStatusEnum = pgEnum("custom_domain_verification_status", [
  "pending",
  "verified",
  "failed",
]);
export const storeStatusEnum = pgEnum("store_status", [
  "pending",
  "active",
  "inactive",
  "suspended",
  "archived",
]);
export const storeMemberRoleEnum = pgEnum("store_member_role", [
  "owner",
  "admin",
  "catalog_manager",
  "inventory_manager",
  "order_manager",
  "support_agent",
]);
export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "active",
  "inactive",
  "archived",
]);
export const categoryStatusEnum = pgEnum("category_status", [
  "active",
  "inactive",
]);
export const collectionStatusEnum = pgEnum("collection_status", [
  "draft",
  "published",
]);
export const cartStatusEnum = pgEnum("cart_status", ["active", "converted", "abandoned", "expired"]);
export const checkoutStatusEnum = pgEnum("checkout_status", ["active", "ready", "completed", "cancelled", "expired"]);
export const addressTypeEnum = pgEnum("address_type", ["shipping", "billing"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "pending_confirmation",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "returned",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["trial", "active", "past_due", "suspended", "expired", "cancelled"]);
export const billingIntervalEnum = pgEnum("billing_interval", ["monthly", "yearly"]);
export const notificationAudienceEnum = pgEnum("notification_audience", ["seller", "customer"]);
export const notificationStatusEnum = pgEnum("notification_status", ["pending", "sent", "failed", "read"]);
export const backgroundJobStatusEnum = pgEnum("background_job_status", ["started", "succeeded", "failed"]);
export const conversationStatusEnum = pgEnum("conversation_status", ["open", "closed"]);
export const messageSenderTypeEnum = pgEnum("message_sender_type", ["customer", "seller"]);
export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed_amount", "free_shipping"]);
export const discountStatusEnum = pgEnum("discount_status", ["draft", "active", "inactive"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["cod", "external"]);
export const paymentAttemptStatusEnum = pgEnum("payment_attempt_status", ["created", "pending", "succeeded", "failed", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "authorized", "paid", "failed", "cancelled", "refunded", "partially_refunded"]);
export const fulfillmentStatusEnum = pgEnum("fulfillment_status", ["unfulfilled", "processing", "fulfilled", "returned"]);
export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", [
  "initial_stock",
  "purchase",
  "return",
  "order_cancelled",
  "damaged",
  "manual_increase",
  "manual_decrease",
  "set_quantity",
  "reservation",
  "reservation_release",
  "reservation_expiry",
  "sale",
  "cancellation_restore",
  "return_restore",
  "correction",
]);
export const inventoryReservationStatusEnum = pgEnum(
  "inventory_reservation_status",
  ["active", "converted", "released", "expired", "cancelled"],
);
export const storeThemeLifecycleEnum = pgEnum("store_theme_lifecycle", [
  "draft",
  "published",
  "archived",
]);
export const storeThemeFontEnum = pgEnum("store_theme_font", [
  "system_sans",
  "system_serif",
  "georgia",
  "arial",
  "verdana",
]);
export const storeThemeHeaderLayoutEnum = pgEnum("store_theme_header_layout", [
  "logo_left",
  "logo_centered",
]);
export const storeThemeHeaderStyleEnum = pgEnum("store_theme_header_style", [
  "solid",
  "minimal",
]);
export const storeThemeFooterStyleEnum = pgEnum("store_theme_footer_style", [
  "simple",
  "columns",
]);
export const storeThemeProductCardStyleEnum = pgEnum(
  "store_theme_product_card_style",
  ["minimal", "bordered", "elevated"],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    platformRole: platformRoleEnum("platform_role").default("user").notNull(),
    status: userStatusEnum("status").default("active").notNull(),
    mustChangePassword: boolean("must_change_password").default(true).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull(),
    subdomain: varchar("subdomain", { length: 63 }).notNull(),
    customDomain: varchar("custom_domain", { length: 253 }),
    logoUrl: text("logo_url"),
    status: storeStatusEnum("status").default("pending").notNull(),
    storefrontEnabled: boolean("storefront_enabled").default(true).notNull(),
    storefrontPublishedAt: timestamp("storefront_published_at", { withTimezone: true }),
    theme: jsonb("theme")
      .$type<{
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        textColor: string;
      }>()
      .default({
        primaryColor: "#4F46E5",
        secondaryColor: "#0F766E",
        backgroundColor: "#FFFFFF",
        textColor: "#111827",
      })
      .notNull(),
    deactivationReason: text("deactivation_reason"),
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
    deactivatedBy: uuid("deactivated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("stores_slug_unique").on(table.slug),
    uniqueIndex("stores_subdomain_unique").on(table.subdomain),
    uniqueIndex("stores_custom_domain_unique").on(table.customDomain),
    index("stores_status_idx").on(table.status),
    index("stores_owner_idx").on(table.ownerId),
  ],
);


export const storeDomains = pgTable(
  "store_domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    hostname: varchar("hostname", { length: 253 }).notNull(),
    normalizedHostname: varchar("normalized_hostname", { length: 253 }).notNull(),
    verificationStatus: customDomainVerificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),
    verificationTokenHash: text("verification_token_hash"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("store_domains_hostname_unique").on(table.normalizedHostname),
    uniqueIndex("store_domains_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("store_domains_store_primary_unique")
      .on(table.storeId)
      .where(sql`${table.isPrimary} = true`),
    index("store_domains_store_status_idx").on(
      table.storeId,
      table.verificationStatus,
    ),
    check(
      "store_domains_hostname_format",
      sql`${table.normalizedHostname} ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$'`,
    ),
  ],
);

export const storeMembers = pgTable(
  "store_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: storeMemberRoleEnum("role").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("store_members_store_user_unique").on(
      table.storeId,
      table.userId,
    ),
    index("store_members_user_idx").on(table.userId),
  ],
);

export const storeSettings = pgTable(
  "store_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 150 }).notNull(),
    description: text("description"),
    contactEmail: varchar("contact_email", { length: 254 }),
    contactPhone: varchar("contact_phone", { length: 32 }),
    businessAddress: text("business_address"),
    storePolicies: text("store_policies"),
    defaultCurrency: varchar("default_currency", { length: 3 })
      .default("PKR")
      .notNull(),
    facebookUrl: text("facebook_url"),
    instagramUrl: text("instagram_url"),
    youtubeUrl: text("youtube_url"),
    tiktokUrl: text("tiktok_url"),
    xUrl: text("x_url"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("store_settings_store_unique").on(table.storeId),
    check(
      "store_settings_currency_format",
      sql`${table.defaultCurrency} ~ '^[A-Z]{3}$'`,
    ),
  ],
);

export const storeAssets = pgTable(
  "store_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 50 }).notNull(),
    storageProvider: varchar("storage_provider", { length: 32 }).notNull(),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url").notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    isCurrent: boolean("is_current").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("store_assets_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("store_assets_storage_key_unique").on(
      table.storageProvider,
      table.storageKey,
    ),
    uniqueIndex("store_assets_current_category_unique")
      .on(table.storeId, table.category)
      .where(sql`${table.isCurrent} = true`),
    index("store_assets_store_category_idx").on(table.storeId, table.category),
    check(
      "store_assets_category_format",
      sql`${table.category} ~ '^[a-z][a-z0-9_]{0,49}$'`,
    ),
    check("store_assets_size_positive", sql`${table.sizeBytes} > 0`),
    check(
      "store_assets_width_positive",
      sql`${table.width} is null or ${table.width} > 0`,
    ),
    check(
      "store_assets_height_positive",
      sql`${table.height} is null or ${table.height} > 0`,
    ),
  ],
);

export const storeThemeConfigurations = pgTable(
  "store_theme_configurations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    lifecycle: storeThemeLifecycleEnum("lifecycle").notNull(),
    revision: integer("revision").default(1).notNull(),
    publishedVersion: integer("published_version"),
    primaryColor: varchar("primary_color", { length: 7 })
      .default("#4F46E5")
      .notNull(),
    secondaryColor: varchar("secondary_color", { length: 7 })
      .default("#0F766E")
      .notNull(),
    backgroundColor: varchar("background_color", { length: 7 })
      .default("#FFFFFF")
      .notNull(),
    textColor: varchar("text_color", { length: 7 })
      .default("#111827")
      .notNull(),
    headingFont: storeThemeFontEnum("heading_font")
      .default("system_sans")
      .notNull(),
    bodyFont: storeThemeFontEnum("body_font").default("system_sans").notNull(),
    headerLayout: storeThemeHeaderLayoutEnum("header_layout")
      .default("logo_left")
      .notNull(),
    headerStyle: storeThemeHeaderStyleEnum("header_style")
      .default("solid")
      .notNull(),
    headerSticky: boolean("header_sticky").default(true).notNull(),
    headerShowLogo: boolean("header_show_logo").default(true).notNull(),
    buttonRadius: integer("button_radius").default(8).notNull(),
    cardRadius: integer("card_radius").default(12).notNull(),
    productCardStyle: storeThemeProductCardStyleEnum("product_card_style")
      .default("bordered")
      .notNull(),
    footerStyle: storeThemeFooterStyleEnum("footer_style")
      .default("simple")
      .notNull(),
    footerShowContact: boolean("footer_show_contact").default(true).notNull(),
    footerText: varchar("footer_text", { length: 200 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("store_theme_current_draft_unique")
      .on(table.storeId)
      .where(sql`${table.lifecycle} = 'draft'`),
    uniqueIndex("store_theme_current_published_unique")
      .on(table.storeId)
      .where(sql`${table.lifecycle} = 'published'`),
    uniqueIndex("store_theme_published_version_unique").on(
      table.storeId,
      table.publishedVersion,
    ),
    index("store_theme_history_idx").on(table.storeId, table.publishedAt),
    check("store_theme_revision_positive", sql`${table.revision} > 0`),
    check(
      "store_theme_button_radius_range",
      sql`${table.buttonRadius} between 0 and 32`,
    ),
    check(
      "store_theme_card_radius_range",
      sql`${table.cardRadius} between 0 and 32`,
    ),
    check(
      "store_theme_publication_state_valid",
      sql`(
        (${table.lifecycle} = 'draft' and ${table.publishedVersion} is null and ${table.publishedAt} is null)
        or
        (${table.lifecycle} in ('published', 'archived') and ${table.publishedVersion} > 0 and ${table.publishedAt} is not null)
      )`,
    ),
    check(
      "store_theme_primary_color_hex",
      sql`${table.primaryColor} ~ '^#[0-9A-Fa-f]{6}$'`,
    ),
    check(
      "store_theme_secondary_color_hex",
      sql`${table.secondaryColor} ~ '^#[0-9A-Fa-f]{6}$'`,
    ),
    check(
      "store_theme_background_color_hex",
      sql`${table.backgroundColor} ~ '^#[0-9A-Fa-f]{6}$'`,
    ),
    check(
      "store_theme_text_color_hex",
      sql`${table.textColor} ~ '^#[0-9A-Fa-f]{6}$'`,
    ),
  ],
);

export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull(),
    description: text("description"),
    imageAssetId: uuid("image_asset_id"),
    sortOrder: integer("sort_order").default(0).notNull(),
    status: categoryStatusEnum("status").default("active").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("product_categories_store_id_unique").on(
      table.storeId,
      table.id,
    ),
    uniqueIndex("product_categories_store_slug_unique").on(
      table.storeId,
      table.slug,
    ),
    index("product_categories_store_status_idx").on(
      table.storeId,
      table.status,
    ),
    check(
      "product_categories_sort_order_nonnegative",
      sql`${table.sortOrder} >= 0`,
    ),
    foreignKey({
      columns: [table.storeId, table.imageAssetId],
      foreignColumns: [storeAssets.storeId, storeAssets.id],
      name: "product_categories_store_image_asset_fk",
    }).onDelete("restrict"),
  ],
);

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull(),
    description: text("description"),
    status: collectionStatusEnum("status").default("draft").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("collections_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("collections_store_slug_unique").on(table.storeId, table.slug),
    index("collections_store_status_idx").on(table.storeId, table.status),
    check("collections_sort_order_nonnegative", sql`${table.sortOrder} >= 0`),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description"),
    categoryId: uuid("category_id"),
    priceMinor: integer("price_minor").default(0).notNull(),
    compareAtPriceMinor: integer("compare_at_price_minor"),
    costPriceMinor: integer("cost_price_minor"),
    barcode: varchar("barcode", { length: 100 }),
    keywords: text("keywords")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    status: productStatusEnum("status").default("draft").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("products_store_slug_unique").on(table.storeId, table.slug),
    index("products_store_status_idx").on(table.storeId, table.status),
    index("products_store_category_idx").on(table.storeId, table.categoryId),
    check("products_price_minor_nonnegative", sql`${table.priceMinor} >= 0`),
    check(
      "products_compare_at_price_valid",
      sql`${table.compareAtPriceMinor} is null or ${table.compareAtPriceMinor} >= ${table.priceMinor}`,
    ),
    check(
      "products_cost_price_nonnegative",
      sql`${table.costPriceMinor} is null or ${table.costPriceMinor} >= 0`,
    ),
    foreignKey({
      columns: [table.storeId, table.categoryId],
      foreignColumns: [productCategories.storeId, productCategories.id],
      name: "products_store_category_fk",
    }).onDelete("restrict"),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull(),
    title: varchar("title", { length: 180 }).default("Default").notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    barcode: varchar("barcode", { length: 100 }),
    priceOverrideMinor: integer("price_override_minor"),
    compareAtPriceMinor: integer("compare_at_price_minor"),
    costPriceMinor: integer("cost_price_minor"),
    isActive: boolean("is_active").default(true).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("product_variants_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("product_variants_store_product_id_unique").on(
      table.storeId,
      table.productId,
      table.id,
    ),
    uniqueIndex("product_variants_store_sku_unique").on(
      table.storeId,
      table.sku,
    ),
    index("product_variants_product_idx").on(table.productId),
    check(
      "product_variants_price_override_nonnegative",
      sql`${table.priceOverrideMinor} is null or ${table.priceOverrideMinor} >= 0`,
    ),
    check(
      "product_variants_compare_at_price_valid",
      sql`${table.compareAtPriceMinor} is null or ${table.compareAtPriceMinor} >= coalesce(${table.priceOverrideMinor}, 0)`,
    ),
    check(
      "product_variants_cost_price_nonnegative",
      sql`${table.costPriceMinor} is null or ${table.costPriceMinor} >= 0`,
    ),
    foreignKey({
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
      name: "product_variants_store_product_fk",
    }).onDelete("cascade"),
  ],
);

export const collectionProducts = pgTable(
  "collection_products",
  {
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id").notNull(),
    productId: uuid("product_id").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("collection_products_unique").on(
      table.storeId,
      table.collectionId,
      table.productId,
    ),
    index("collection_products_product_idx").on(table.productId),
    check(
      "collection_products_sort_order_nonnegative",
      sql`${table.sortOrder} >= 0`,
    ),
    foreignKey({
      columns: [table.storeId, table.collectionId],
      foreignColumns: [collections.storeId, collections.id],
      name: "collection_products_store_collection_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
      name: "collection_products_store_product_fk",
    }).onDelete("cascade"),
  ],
);

export const productOptions = pgTable(
  "product_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    position: integer("position").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("product_options_store_product_id_unique").on(
      table.storeId,
      table.productId,
      table.id,
    ),
    uniqueIndex("product_options_product_name_unique").on(
      table.storeId,
      table.productId,
      table.name,
    ),
    uniqueIndex("product_options_product_position_unique").on(
      table.storeId,
      table.productId,
      table.position,
    ),
    check("product_options_position_nonnegative", sql`${table.position} >= 0`),
    foreignKey({
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
      name: "product_options_store_product_fk",
    }).onDelete("cascade"),
  ],
);

export const productOptionValues = pgTable(
  "product_option_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull(),
    optionId: uuid("option_id").notNull(),
    value: varchar("value", { length: 100 }).notNull(),
    position: integer("position").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("product_option_values_store_product_id_unique").on(
      table.storeId,
      table.productId,
      table.id,
    ),
    uniqueIndex("product_option_values_option_value_unique").on(
      table.storeId,
      table.optionId,
      table.value,
    ),
    uniqueIndex("product_option_values_option_position_unique").on(
      table.storeId,
      table.optionId,
      table.position,
    ),
    check(
      "product_option_values_position_nonnegative",
      sql`${table.position} >= 0`,
    ),
    foreignKey({
      columns: [table.storeId, table.productId, table.optionId],
      foreignColumns: [
        productOptions.storeId,
        productOptions.productId,
        productOptions.id,
      ],
      name: "product_option_values_store_product_option_fk",
    }).onDelete("cascade"),
  ],
);

export const productVariantValues = pgTable(
  "product_variant_values",
  {
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id").notNull(),
    optionValueId: uuid("option_value_id").notNull(),
  },
  (table) => [
    uniqueIndex("product_variant_values_unique").on(
      table.storeId,
      table.variantId,
      table.optionValueId,
    ),
    index("product_variant_values_option_value_idx").on(table.optionValueId),
    foreignKey({
      columns: [table.storeId, table.productId, table.variantId],
      foreignColumns: [
        productVariants.storeId,
        productVariants.productId,
        productVariants.id,
      ],
      name: "product_variant_values_store_product_variant_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.storeId, table.productId, table.optionValueId],
      foreignColumns: [
        productOptionValues.storeId,
        productOptionValues.productId,
        productOptionValues.id,
      ],
      name: "product_variant_values_store_product_option_value_fk",
    }).onDelete("cascade"),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id"),
    storageProvider: varchar("storage_provider", { length: 32 }).notNull(),
    storageKey: text("storage_key").notNull(),
    publicUrl: text("public_url").notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    altText: varchar("alt_text", { length: 250 }),
    position: integer("position").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("product_images_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("product_images_storage_key_unique").on(
      table.storageProvider,
      table.storageKey,
    ),
    uniqueIndex("product_images_product_position_unique").on(
      table.storeId,
      table.productId,
      table.position,
    ),
    uniqueIndex("product_images_product_primary_unique")
      .on(table.storeId, table.productId)
      .where(sql`${table.isPrimary} = true`),
    index("product_images_product_idx").on(
      table.storeId,
      table.productId,
      table.position,
    ),
    index("product_images_variant_idx").on(table.storeId, table.variantId),
    check("product_images_size_positive", sql`${table.sizeBytes} > 0`),
    check("product_images_width_positive", sql`${table.width} > 0`),
    check("product_images_height_positive", sql`${table.height} > 0`),
    check("product_images_position_nonnegative", sql`${table.position} >= 0`),
    foreignKey({
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
      name: "product_images_store_product_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.storeId, table.productId, table.variantId],
      foreignColumns: [
        productVariants.storeId,
        productVariants.productId,
        productVariants.id,
      ],
      name: "product_images_store_product_variant_fk",
    }).onDelete("restrict"),
  ],
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id").notNull(),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    reservedQuantity: integer("reserved_quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
    allowBackorder: boolean("allow_backorder").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("inventory_items_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("inventory_items_variant_unique").on(table.variantId),
    index("inventory_items_store_idx").on(table.storeId),
    check("inventory_stock_nonnegative", sql`${table.stockQuantity} >= 0`),
    check(
      "inventory_reserved_nonnegative",
      sql`${table.reservedQuantity} >= 0`,
    ),
    check(
      "inventory_reserved_not_above_stock",
      sql`${table.reservedQuantity} <= ${table.stockQuantity}`,
    ),
    foreignKey({
      columns: [table.storeId, table.productId, table.variantId],
      foreignColumns: [
        productVariants.storeId,
        productVariants.productId,
        productVariants.id,
      ],
      name: "inventory_items_store_variant_fk",
    }).onDelete("cascade"),
  ],
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id"),
    inventoryItemId: uuid("inventory_item_id").notNull(),
    movementType: inventoryMovementTypeEnum("type").notNull(),
    quantityDelta: integer("quantity").notNull(),
    stockBefore: integer("previous_quantity").notNull(),
    stockAfter: integer("new_quantity").notNull(),
    reservedBefore: integer("reserved_before").default(0).notNull(),
    reservedAfter: integer("reserved_after").default(0).notNull(),
    reason: text("reason"),
    referenceType: varchar("reference_type", { length: 50 }),
    referenceId: uuid("reference_id"),
    actorUserId: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    idempotencyKey: varchar("idempotency_key", { length: 120 }),
    metadata: jsonb("metadata")
      .$type<Record<string, string | number | boolean | null>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("inventory_movements_item_created_idx").on(
      table.inventoryItemId,
      table.createdAt,
    ),
    index("inventory_movements_store_product_created_idx").on(
      table.storeId,
      table.productId,
      table.createdAt,
    ),
    uniqueIndex("inventory_movements_store_idempotency_unique")
      .on(table.storeId, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
    check(
      "inventory_movements_stock_before_nonnegative",
      sql`${table.stockBefore} >= 0`,
    ),
    check(
      "inventory_movements_stock_after_nonnegative",
      sql`${table.stockAfter} >= 0`,
    ),
    check(
      "inventory_movements_reserved_before_valid",
      sql`${table.reservedBefore} >= 0 and ${table.reservedBefore} <= ${table.stockBefore}`,
    ),
    check(
      "inventory_movements_reserved_after_valid",
      sql`${table.reservedAfter} >= 0 and ${table.reservedAfter} <= ${table.stockAfter}`,
    ),
    foreignKey({
      columns: [table.storeId, table.inventoryItemId],
      foreignColumns: [inventoryItems.storeId, inventoryItems.id],
      name: "inventory_movements_store_inventory_item_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
      name: "inventory_movements_store_product_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.storeId, table.productId, table.variantId],
      foreignColumns: [
        productVariants.storeId,
        productVariants.productId,
        productVariants.id,
      ],
      name: "inventory_movements_store_product_variant_fk",
    }).onDelete("restrict"),
  ],
);

export const inventoryReservations = pgTable(
  "inventory_reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id"),
    inventoryItemId: uuid("inventory_item_id").notNull(),
    quantity: integer("quantity").notNull(),
    status: inventoryReservationStatusEnum("status")
      .default("active")
      .notNull(),
    referenceType: varchar("reference_type", { length: 50 }).notNull(),
    referenceId: uuid("reference_id").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 120 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("inventory_reservations_store_id_unique").on(
      table.storeId,
      table.id,
    ),
    uniqueIndex("inventory_reservations_store_idempotency_unique").on(
      table.storeId,
      table.idempotencyKey,
    ),
    index("inventory_reservations_store_status_expires_idx").on(
      table.storeId,
      table.status,
      table.expiresAt,
    ),
    index("inventory_reservations_reference_idx").on(
      table.storeId,
      table.referenceType,
      table.referenceId,
    ),
    check(
      "inventory_reservations_quantity_positive",
      sql`${table.quantity} > 0`,
    ),
    foreignKey({
      columns: [table.storeId, table.inventoryItemId],
      foreignColumns: [inventoryItems.storeId, inventoryItems.id],
      name: "inventory_reservations_store_inventory_item_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.storeId, table.productId],
      foreignColumns: [products.storeId, products.id],
      name: "inventory_reservations_store_product_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.storeId, table.productId, table.variantId],
      foreignColumns: [
        productVariants.storeId,
        productVariants.productId,
        productVariants.id,
      ],
      name: "inventory_reservations_store_product_variant_fk",
    }).onDelete("restrict"),
  ],
);


export const carts = pgTable(
  "carts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id"),
    guestTokenHash: varchar("guest_token_hash", { length: 64 }),
    status: cartStatusEnum("status").default("active").notNull(),
    currency: varchar("currency", { length: 3 }).default("PKR").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("carts_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("carts_store_guest_active_unique")
      .on(table.storeId, table.guestTokenHash)
      .where(sql`${table.status} = 'active' and ${table.guestTokenHash} is not null`),
    uniqueIndex("carts_store_customer_active_unique")
      .on(table.storeId, table.customerId)
      .where(sql`${table.status} = 'active' and ${table.customerId} is not null`),
    index("carts_expiry_idx").on(table.status, table.expiresAt),
    check("carts_owner_present", sql`${table.customerId} is not null or ${table.guestTokenHash} is not null`),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    cartId: uuid("cart_id").notNull(),
    productId: uuid("product_id").notNull(),
    variantId: uuid("variant_id").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cart_items_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("cart_items_cart_variant_unique").on(table.cartId, table.variantId),
    index("cart_items_cart_idx").on(table.cartId),
    check("cart_items_quantity_positive", sql`${table.quantity} > 0 and ${table.quantity} <= 99`),
    check("cart_items_price_nonnegative", sql`${table.unitPriceMinor} >= 0`),
    foreignKey({ columns: [table.storeId, table.cartId], foreignColumns: [carts.storeId, carts.id], name: "cart_items_store_cart_fk" }).onDelete("cascade"),
    foreignKey({ columns: [table.storeId, table.productId, table.variantId], foreignColumns: [productVariants.storeId, productVariants.productId, productVariants.id], name: "cart_items_store_variant_fk" }).onDelete("restrict"),
  ],
);


export const checkoutSessions = pgTable(
  "checkout_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "restrict" }),
    cartId: uuid("cart_id").notNull(),
    customerId: uuid("customer_id"),
    guestTokenHash: varchar("guest_token_hash", { length: 64 }),
    guestEmail: varchar("guest_email", { length: 254 }),
    status: checkoutStatusEnum("status").default("active").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    subtotalMinor: integer("subtotal_minor").notNull(),
    discountMinor: integer("discount_minor").default(0).notNull(),
    shippingMinor: integer("shipping_minor").default(0).notNull(),
    taxMinor: integer("tax_minor").default(0).notNull(),
    totalMinor: integer("total_minor").notNull(),
    shippingMethodCode: varchar("shipping_method_code", { length: 80 }),
    discountId: uuid("discount_id"),
    couponId: uuid("coupon_id"),
    couponCode: varchar("coupon_code", { length: 80 }),
    idempotencyKey: varchar("idempotency_key", { length: 120 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("checkout_sessions_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("checkout_sessions_store_idempotency_unique").on(table.storeId, table.idempotencyKey),
    index("checkout_sessions_expiry_idx").on(table.status, table.expiresAt),
    check("checkout_sessions_totals_nonnegative", sql`${table.subtotalMinor} >= 0 and ${table.discountMinor} >= 0 and ${table.shippingMinor} >= 0 and ${table.taxMinor} >= 0 and ${table.totalMinor} >= 0`),
    check("checkout_sessions_owner_present", sql`${table.customerId} is not null or ${table.guestTokenHash} is not null`),
    foreignKey({ columns: [table.storeId, table.cartId], foreignColumns: [carts.storeId, carts.id], name: "checkout_sessions_store_cart_fk" }).onDelete("restrict"),
  ],
);

export const checkoutAddresses = pgTable(
  "checkout_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    checkoutSessionId: uuid("checkout_session_id").notNull().references(() => checkoutSessions.id, { onDelete: "cascade" }),
    type: addressTypeEnum("type").notNull(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    addressLine1: varchar("address_line_1", { length: 200 }).notNull(),
    addressLine2: varchar("address_line_2", { length: 200 }),
    city: varchar("city", { length: 100 }).notNull(),
    region: varchar("region", { length: 100 }).notNull(),
    postalCode: varchar("postal_code", { length: 24 }),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("checkout_addresses_session_type_unique").on(table.checkoutSessionId, table.type),
    index("checkout_addresses_session_idx").on(table.checkoutSessionId),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),
    orderNumber: varchar("order_number", { length: 50 }).notNull(),
    customerId: uuid("customer_id"),
    customerEmail: varchar("customer_email", { length: 254 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 32 }),
    publicReference: varchar("public_reference", { length: 64 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 120 }).notNull(),
    status: orderStatusEnum("status").default("pending_confirmation").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
    fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").default("unfulfilled").notNull(),
    currency: varchar("currency", { length: 3 }).default("PKR").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discountTotal: numeric("discount_total", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    shippingTotal: numeric("shipping_total", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull(),
    subtotalMinor: integer("subtotal_minor").notNull(),
    discountMinor: integer("discount_minor").default(0).notNull(),
    shippingMinor: integer("shipping_minor").default(0).notNull(),
    taxMinor: integer("tax_minor").default(0).notNull(),
    totalMinor: integer("total_minor").notNull(),
    notes: text("notes"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("orders_store_number_unique").on(
      table.storeId,
      table.orderNumber,
    ),
    uniqueIndex("orders_public_reference_unique").on(table.publicReference),
    uniqueIndex("orders_store_idempotency_unique").on(table.storeId, table.idempotencyKey),
    index("orders_store_status_idx").on(table.storeId, table.status),
    index("orders_customer_email_idx").on(table.customerEmail),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 180 }).notNull(),
    variantName: varchar("variant_name", { length: 180 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    lineTotalMinor: integer("line_total_minor").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
  ],
);


export const orderAddresses = pgTable(
  "order_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    type: addressTypeEnum("type").notNull(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    addressLine1: varchar("address_line_1", { length: 200 }).notNull(),
    addressLine2: varchar("address_line_2", { length: 200 }),
    city: varchar("city", { length: 100 }).notNull(),
    region: varchar("region", { length: 100 }).notNull(),
    postalCode: varchar("postal_code", { length: 24 }),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("order_addresses_order_type_unique").on(table.orderId, table.type)],
);
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("order_status_history_order_idx").on(table.orderId, table.createdAt)],
);
export const orderFulfillments = pgTable(
  "order_fulfillments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    carrier: varchar("carrier", { length: 100 }),
    trackingNumber: varchar("tracking_number", { length: 150 }),
    trackingUrl: text("tracking_url"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("order_fulfillments_order_idx").on(table.orderId)],
);


export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 254 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    status: customerStatusEnum("status").default("active").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    marketingConsent: boolean("marketing_consent").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("customers_store_email_unique").on(table.storeId, table.email),
    uniqueIndex("customers_store_id_unique").on(table.storeId, table.id),
    index("customers_store_status_idx").on(table.storeId, table.status),
  ],
);


export const discounts = pgTable(
  "discounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    type: discountTypeEnum("type").notNull(),
    value: integer("value").default(0).notNull(),
    status: discountStatusEnum("status").default("draft").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    minimumSubtotalMinor: integer("minimum_subtotal_minor").default(0).notNull(),
    maximumDiscountMinor: integer("maximum_discount_minor"),
    usageLimit: integer("usage_limit"),
    usagePerCustomer: integer("usage_per_customer"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("discounts_store_id_unique").on(table.storeId, table.id),
    index("discounts_store_status_idx").on(table.storeId, table.status),
    check("discounts_values_nonnegative", sql`${table.value} >= 0 and ${table.minimumSubtotalMinor} >= 0 and (${table.maximumDiscountMinor} is null or ${table.maximumDiscountMinor} >= 0)`),
  ],
);
export const couponCodes = pgTable(
  "coupon_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    discountId: uuid("discount_id").notNull(),
    code: varchar("code", { length: 80 }).notNull(),
    normalizedCode: varchar("normalized_code", { length: 80 }).notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("coupon_codes_store_code_unique").on(table.storeId, table.normalizedCode),
    foreignKey({ columns: [table.storeId, table.discountId], foreignColumns: [discounts.storeId, discounts.id], name: "coupon_codes_store_discount_fk" }).onDelete("cascade"),
  ],
);
export const discountProducts = pgTable("discount_products", { storeId: uuid("store_id").notNull(), discountId: uuid("discount_id").notNull(), productId: uuid("product_id").notNull() }, (table) => [uniqueIndex("discount_products_unique").on(table.storeId, table.discountId, table.productId), foreignKey({columns:[table.storeId,table.discountId],foreignColumns:[discounts.storeId,discounts.id],name:"discount_products_store_discount_fk"}).onDelete("cascade"), foreignKey({columns:[table.storeId,table.productId],foreignColumns:[products.storeId,products.id],name:"discount_products_store_product_fk"}).onDelete("cascade")]);
export const discountCategories = pgTable("discount_categories", { storeId: uuid("store_id").notNull(), discountId: uuid("discount_id").notNull(), categoryId: uuid("category_id").notNull() }, (table) => [uniqueIndex("discount_categories_unique").on(table.storeId, table.discountId, table.categoryId), foreignKey({columns:[table.storeId,table.discountId],foreignColumns:[discounts.storeId,discounts.id],name:"discount_categories_store_discount_fk"}).onDelete("cascade"), foreignKey({columns:[table.storeId,table.categoryId],foreignColumns:[productCategories.storeId,productCategories.id],name:"discount_categories_store_category_fk"}).onDelete("cascade")]);
export const discountCollections = pgTable("discount_collections", { storeId: uuid("store_id").notNull(), discountId: uuid("discount_id").notNull(), collectionId: uuid("collection_id").notNull() }, (table) => [uniqueIndex("discount_collections_unique").on(table.storeId, table.discountId, table.collectionId), foreignKey({columns:[table.storeId,table.discountId],foreignColumns:[discounts.storeId,discounts.id],name:"discount_collections_store_discount_fk"}).onDelete("cascade"), foreignKey({columns:[table.storeId,table.collectionId],foreignColumns:[collections.storeId,collections.id],name:"discount_collections_store_collection_fk"}).onDelete("cascade")]);
export const discountRedemptions = pgTable(
  "discount_redemptions",
  { id: uuid("id").defaultRandom().primaryKey(), storeId: uuid("store_id").notNull(), discountId: uuid("discount_id").notNull(), couponId: uuid("coupon_id"), orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }), customerId: uuid("customer_id"), customerEmail: varchar("customer_email", { length: 254 }), amountMinor: integer("amount_minor").notNull(), reversedAt: timestamp("reversed_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() },
  (table) => [uniqueIndex("discount_redemptions_order_discount_unique").on(table.orderId, table.discountId), index("discount_redemptions_discount_idx").on(table.discountId), foreignKey({columns:[table.storeId,table.discountId],foreignColumns:[discounts.storeId,discounts.id],name:"discount_redemptions_store_discount_fk"}).onDelete("restrict")],
);
export const shippingZones = pgTable(
  "shipping_zones",
  { id: uuid("id").defaultRandom().primaryKey(), storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }), name: varchar("name", { length: 120 }).notNull(), countryCodes: text("country_codes").array().default(sql`'{}'::text[]`).notNull(), isActive: boolean("is_active").default(true).notNull(), ...timestamps },
  (table) => [uniqueIndex("shipping_zones_store_id_unique").on(table.storeId, table.id), uniqueIndex("shipping_zones_store_name_unique").on(table.storeId, table.name)],
);
export const shippingMethods = pgTable(
  "shipping_methods",
  { id: uuid("id").defaultRandom().primaryKey(), storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }), zoneId: uuid("zone_id").notNull(), code: varchar("code", { length: 80 }).notNull(), name: varchar("name", { length: 120 }).notNull(), description: text("description"), rateMinor: integer("rate_minor").default(0).notNull(), freeAboveMinor: integer("free_above_minor"), estimatedDaysMin: integer("estimated_days_min"), estimatedDaysMax: integer("estimated_days_max"), isActive: boolean("is_active").default(true).notNull(), ...timestamps },
  (table) => [uniqueIndex("shipping_methods_store_code_unique").on(table.storeId, table.code), uniqueIndex("shipping_methods_store_id_unique").on(table.storeId, table.id), foreignKey({columns:[table.storeId,table.zoneId],foreignColumns:[shippingZones.storeId,shippingZones.id],name:"shipping_methods_store_zone_fk"}).onDelete("cascade"), check("shipping_methods_rate_nonnegative",sql`${table.rateMinor} >= 0`)],
);


export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    subject: varchar("subject", { length: 180 }).notNull(),
    status: conversationStatusEnum("status").default("open").notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("conversations_store_id_unique").on(table.storeId, table.id),
    index("conversations_store_last_message_idx").on(table.storeId, table.lastMessageAt),
    index("conversations_customer_idx").on(table.customerId, table.lastMessageAt),
  ],
);
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderType: messageSenderTypeEnum("sender_type").notNull(),
    senderUserId: uuid("sender_user_id").references(() => users.id, { onDelete: "set null" }),
    senderCustomerId: uuid("sender_customer_id").references(() => customers.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("messages_conversation_created_idx").on(table.conversationId, table.createdAt), check("messages_sender_valid", sql`(${table.senderType} = 'seller' and ${table.senderUserId} is not null) or (${table.senderType} = 'customer' and ${table.senderCustomerId} is not null)`)],
);
export const messageAttachments = pgTable(
  "message_attachments",
  { id: uuid("id").defaultRandom().primaryKey(), messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }), storageProvider: varchar("storage_provider", { length: 32 }).notNull(), storageKey: text("storage_key").notNull(), publicUrl: text("public_url").notNull(), filename: varchar("filename", { length: 255 }).notNull(), mimeType: varchar("mime_type", { length: 100 }).notNull(), sizeBytes: integer("size_bytes").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() },
  (table) => [uniqueIndex("message_attachments_storage_unique").on(table.storageProvider, table.storageKey), index("message_attachments_message_idx").on(table.messageId)],
);
export const conversationReads = pgTable(
  "conversation_reads",
  { id: uuid("id").defaultRandom().primaryKey(), conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }), readerType: messageSenderTypeEnum("reader_type").notNull(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }), lastReadAt: timestamp("last_read_at", { withTimezone: true }).defaultNow().notNull() },
  (table) => [uniqueIndex("conversation_reads_user_unique").on(table.conversationId, table.userId), uniqueIndex("conversation_reads_customer_unique").on(table.conversationId, table.customerId)],
);


export const storePaymentSettings = pgTable(
  "store_payment_settings",
  { storeId: uuid("store_id").primaryKey().references(() => stores.id, { onDelete: "cascade" }), codEnabled: boolean("cod_enabled").default(true).notNull(), onlinePaymentsEnabled: boolean("online_payments_enabled").default(false).notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() },
);
export const payments = pgTable(
  "payments",
  { id: uuid("id").defaultRandom().primaryKey(), storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "restrict" }), orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }), provider: paymentProviderEnum("provider").notNull(), providerReference: varchar("provider_reference", { length: 200 }), status: paymentStatusEnum("status").default("pending").notNull(), currency: varchar("currency", { length: 3 }).notNull(), amountMinor: integer("amount_minor").notNull(), collectedAt: timestamp("collected_at", { withTimezone: true }), cancelledAt: timestamp("cancelled_at", { withTimezone: true }), ...timestamps },
  (table) => [uniqueIndex("payments_order_unique").on(table.orderId), uniqueIndex("payments_store_id_unique").on(table.storeId, table.id), index("payments_store_status_idx").on(table.storeId, table.status), check("payments_amount_nonnegative", sql`${table.amountMinor} >= 0`)],
);
export const paymentAttempts = pgTable(
  "payment_attempts",
  { id: uuid("id").defaultRandom().primaryKey(), paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }), idempotencyKey: varchar("idempotency_key", { length: 120 }).notNull(), status: paymentAttemptStatusEnum("status").default("created").notNull(), providerPayload: jsonb("provider_payload").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(), errorCode: varchar("error_code", { length: 100 }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() },
  (table) => [uniqueIndex("payment_attempts_idempotency_unique").on(table.paymentId, table.idempotencyKey), index("payment_attempts_payment_idx").on(table.paymentId)],
);
export const paymentEvents = pgTable(
  "payment_events",
  { id: uuid("id").defaultRandom().primaryKey(), paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }), type: varchar("type", { length: 80 }).notNull(), payload: jsonb("payload").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() },
  (table) => [index("payment_events_payment_idx").on(table.paymentId, table.createdAt)],
);
export const refunds = pgTable(
  "refunds",
  { id: uuid("id").defaultRandom().primaryKey(), paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "restrict" }), amountMinor: integer("amount_minor").notNull(), reason: text("reason"), status: varchar("status", { length: 40 }).default("pending").notNull(), providerReference: varchar("provider_reference", { length: 200 }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull() },
  (table) => [index("refunds_payment_idx").on(table.paymentId), check("refunds_amount_positive", sql`${table.amountMinor} > 0`)],
);
export const webhookEvents = pgTable(
  "webhook_events",
  { id: uuid("id").defaultRandom().primaryKey(), provider: paymentProviderEnum("provider").notNull(), externalEventId: varchar("external_event_id", { length: 200 }).notNull(), signatureHash: varchar("signature_hash", { length: 64 }), payloadHash: varchar("payload_hash", { length: 64 }).notNull(), status: varchar("status", { length: 40 }).default("received").notNull(), processedAt: timestamp("processed_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() },
  (table) => [uniqueIndex("webhook_events_provider_external_unique").on(table.provider, table.externalEventId)],
);


export const subscriptionPlans = pgTable(
  "subscription_plans",
  { id: uuid("id").defaultRandom().primaryKey(), code: varchar("code", { length: 80 }).notNull(), name: varchar("name", { length: 120 }).notNull(), description: text("description"), priceMinor: integer("price_minor").default(0).notNull(), currency: varchar("currency", { length: 3 }).default("PKR").notNull(), billingInterval: billingIntervalEnum("billing_interval").default("monthly").notNull(), productLimit: integer("product_limit").default(100).notNull(), staffLimit: integer("staff_limit").default(3).notNull(), monthlyOrderLimit: integer("monthly_order_limit").default(500).notNull(), storageMbLimit: integer("storage_mb_limit").default(1024).notNull(), customDomainsEnabled: boolean("custom_domains_enabled").default(false).notNull(), messagingEnabled: boolean("messaging_enabled").default(true).notNull(), advancedThemesEnabled: boolean("advanced_themes_enabled").default(false).notNull(), isActive: boolean("is_active").default(true).notNull(), ...timestamps },
  (table) => [uniqueIndex("subscription_plans_code_unique").on(table.code), check("subscription_plan_limits_positive", sql`${table.productLimit} >= 0 and ${table.staffLimit} >= 0 and ${table.monthlyOrderLimit} >= 0 and ${table.storageMbLimit} >= 0 and ${table.priceMinor} >= 0`)],
);
export const storeSubscriptions = pgTable(
  "store_subscriptions",
  { id: uuid("id").defaultRandom().primaryKey(), storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }), planId: uuid("plan_id").notNull().references(() => subscriptionPlans.id, { onDelete: "restrict" }), status: subscriptionStatusEnum("status").default("trial").notNull(), startsAt: timestamp("starts_at", { withTimezone: true }).defaultNow().notNull(), endsAt: timestamp("ends_at", { withTimezone: true }), graceEndsAt: timestamp("grace_ends_at", { withTimezone: true }), cancelledAt: timestamp("cancelled_at", { withTimezone: true }), ...timestamps },
  (table) => [uniqueIndex("store_subscriptions_current_unique").on(table.storeId).where(sql`${table.status} in ('trial','active','past_due')`), index("store_subscriptions_status_end_idx").on(table.status, table.endsAt)],
);
export const subscriptionEvents = pgTable(
  "subscription_events",
  { id: uuid("id").defaultRandom().primaryKey(), subscriptionId: uuid("subscription_id").notNull().references(() => storeSubscriptions.id, { onDelete: "cascade" }), type: varchar("type", { length: 80 }).notNull(), actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }), metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() },
  (table) => [index("subscription_events_subscription_idx").on(table.subscriptionId, table.createdAt)],
);
export const usageCounters = pgTable(
  "usage_counters",
  { id: uuid("id").defaultRandom().primaryKey(), storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }), periodStart: timestamp("period_start", { withTimezone: true }).notNull(), periodEnd: timestamp("period_end", { withTimezone: true }).notNull(), productCount: integer("product_count").default(0).notNull(), staffCount: integer("staff_count").default(0).notNull(), orderCount: integer("order_count").default(0).notNull(), storageBytes: integer("storage_bytes").default(0).notNull(), ...timestamps },
  (table) => [uniqueIndex("usage_counters_store_period_unique").on(table.storeId, table.periodStart), index("usage_counters_period_idx").on(table.periodEnd)],
);

export const notifications = pgTable(
  "notifications",
  { id: uuid("id").defaultRandom().primaryKey(), storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }), audience: notificationAudienceEnum("audience").notNull(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }), type: varchar("type", { length: 80 }).notNull(), title: varchar("title", { length: 180 }).notNull(), body: text("body").notNull(), status: notificationStatusEnum("status").default("pending").notNull(), data: jsonb("data").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(), sentAt: timestamp("sent_at", { withTimezone: true }), readAt: timestamp("read_at", { withTimezone: true }), ...timestamps },
  (table) => [index("notifications_seller_idx").on(table.storeId, table.userId, table.createdAt), index("notifications_customer_idx").on(table.storeId, table.customerId, table.createdAt), check("notifications_recipient_valid", sql`(${table.audience} = 'seller' and ${table.userId} is not null) or (${table.audience} = 'customer' and ${table.customerId} is not null)`)],
);
export const notificationOutbox = pgTable(
  "notification_outbox",
  { id: uuid("id").defaultRandom().primaryKey(), notificationId: uuid("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }), channel: varchar("channel", { length: 32 }).notNull(), idempotencyKey: varchar("idempotency_key", { length: 180 }).notNull(), attempts: integer("attempts").default(0).notNull(), availableAt: timestamp("available_at", { withTimezone: true }).defaultNow().notNull(), processedAt: timestamp("processed_at", { withTimezone: true }), lastError: text("last_error"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() },
  (table) => [uniqueIndex("notification_outbox_idempotency_unique").on(table.idempotencyKey), index("notification_outbox_available_idx").on(table.processedAt, table.availableAt)],
);
export const backgroundJobExecutions = pgTable(
  "background_job_executions",
  { id: uuid("id").defaultRandom().primaryKey(), jobName: varchar("job_name", { length: 100 }).notNull(), idempotencyKey: varchar("idempotency_key", { length: 180 }).notNull(), status: backgroundJobStatusEnum("status").notNull(), attempt: integer("attempt").default(1).notNull(), startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(), finishedAt: timestamp("finished_at", { withTimezone: true }), error: text("error"), metadata: jsonb("metadata").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull() },
  (table) => [uniqueIndex("background_job_executions_idempotency_unique").on(table.jobName, table.idempotencyKey), index("background_job_executions_status_idx").on(table.status, table.startedAt)],
);

export const customerSessions = pgTable(
  "customer_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    rotatedFromId: uuid("rotated_from_id"),
    userAgent: varchar("user_agent", { length: 300 }),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customer_sessions_token_unique").on(table.tokenHash),
    index("customer_sessions_customer_idx").on(table.customerId),
    index("customer_sessions_expiry_idx").on(table.expiresAt),
  ],
);

export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 80 }),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 80 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    addressLine1: varchar("address_line_1", { length: 200 }).notNull(),
    addressLine2: varchar("address_line_2", { length: 200 }),
    city: varchar("city", { length: 100 }).notNull(),
    region: varchar("region", { length: 100 }).notNull(),
    postalCode: varchar("postal_code", { length: 24 }),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    isDefaultShipping: boolean("is_default_shipping").default(false).notNull(),
    isDefaultBilling: boolean("is_default_billing").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("customer_addresses_store_id_unique").on(table.storeId, table.id),
    uniqueIndex("customer_addresses_default_shipping_unique").on(table.customerId).where(sql`${table.isDefaultShipping} = true`),
    uniqueIndex("customer_addresses_default_billing_unique").on(table.customerId).where(sql`${table.isDefaultBilling} = true`),
    index("customer_addresses_customer_idx").on(table.customerId),
  ],
);

export const customerTokens = pgTable(
  "customer_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    type: customerTokenTypeEnum("type").notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customer_tokens_hash_unique").on(table.tokenHash),
    index("customer_tokens_customer_type_idx").on(table.customerId, table.type),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storeId: uuid("store_id").references(() => stores.id, {
      onDelete: "cascade",
    }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("sessions_user_idx").on(table.userId),
    index("sessions_store_idx").on(table.storeId),
  ],
);

export const storesRelations = relations(stores, ({ many, one }) => ({
  owner: one(users, { fields: [stores.ownerId], references: [users.id] }),
  members: many(storeMembers),
  domains: many(storeDomains),
  settings: one(storeSettings),
  assets: many(storeAssets),
  themeConfigurations: many(storeThemeConfigurations),
  categories: many(productCategories),
  collections: many(collections),
  products: many(products),
  carts: many(carts),
  customers: many(customers),
}));


export const storeDomainsRelations = relations(storeDomains, ({ one }) => ({
  store: one(stores, {
    fields: [storeDomains.storeId],
    references: [stores.id],
  }),
}));

export const storeSettingsRelations = relations(storeSettings, ({ one }) => ({
  store: one(stores, {
    fields: [storeSettings.storeId],
    references: [stores.id],
  }),
}));

export const storeAssetsRelations = relations(storeAssets, ({ one }) => ({
  store: one(stores, {
    fields: [storeAssets.storeId],
    references: [stores.id],
  }),
}));

export const storeThemeConfigurationsRelations = relations(
  storeThemeConfigurations,
  ({ one }) => ({
    store: one(stores, {
      fields: [storeThemeConfigurations.storeId],
      references: [stores.id],
    }),
  }),
);

export const productCategoriesRelations = relations(
  productCategories,
  ({ many, one }) => ({
    store: one(stores, {
      fields: [productCategories.storeId],
      references: [stores.id],
    }),
    imageAsset: one(storeAssets, {
      fields: [productCategories.imageAssetId],
      references: [storeAssets.id],
    }),
    products: many(products),
  }),
);

export const collectionsRelations = relations(collections, ({ many, one }) => ({
  store: one(stores, {
    fields: [collections.storeId],
    references: [stores.id],
  }),
  products: many(collectionProducts),
}));

export const productsRelations = relations(products, ({ many, one }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  collections: many(collectionProducts),
  options: many(productOptions),
  variants: many(productVariants),
}));

export const collectionProductsRelations = relations(
  collectionProducts,
  ({ one }) => ({
    collection: one(collections, {
      fields: [collectionProducts.collectionId],
      references: [collections.id],
    }),
    product: one(products, {
      fields: [collectionProducts.productId],
      references: [products.id],
    }),
  }),
);

export const productOptionsRelations = relations(
  productOptions,
  ({ many, one }) => ({
    product: one(products, {
      fields: [productOptions.productId],
      references: [products.id],
    }),
    values: many(productOptionValues),
  }),
);

export const productOptionValuesRelations = relations(
  productOptionValues,
  ({ many, one }) => ({
    option: one(productOptions, {
      fields: [productOptionValues.optionId],
      references: [productOptions.id],
    }),
    variants: many(productVariantValues),
  }),
);

export const productVariantsRelations = relations(
  productVariants,
  ({ many, one }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    inventoryItem: one(inventoryItems),
    values: many(productVariantValues),
  }),
);

export const productVariantValuesRelations = relations(
  productVariantValues,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [productVariantValues.variantId],
      references: [productVariants.id],
    }),
    optionValue: one(productOptionValues, {
      fields: [productVariantValues.optionValueId],
      references: [productOptionValues.id],
    }),
  }),
);

export const cartsRelations = relations(carts, ({ many, one }) => ({
  store: one(stores, { fields: [carts.storeId], references: [stores.id] }),
  items: many(cartItems),
}));
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));

export const checkoutSessionsRelations = relations(checkoutSessions, ({ many, one }) => ({
  cart: one(carts, { fields: [checkoutSessions.cartId], references: [carts.id] }),
  addresses: many(checkoutAddresses),
}));
export const checkoutAddressesRelations = relations(checkoutAddresses, ({ one }) => ({
  checkout: one(checkoutSessions, { fields: [checkoutAddresses.checkoutSessionId], references: [checkoutSessions.id] }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  items: many(orderItems),
  addresses: many(orderAddresses),
  history: many(orderStatusHistory),
  fulfillments: many(orderFulfillments),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));

export const customersRelations = relations(customers, ({ many, one }) => ({
  store: one(stores, { fields: [customers.storeId], references: [stores.id] }),
  sessions: many(customerSessions),
  addresses: many(customerAddresses),
  tokens: many(customerTokens),
}));
export const customerSessionsRelations = relations(customerSessions, ({ one }) => ({
  customer: one(customers, { fields: [customerSessions.customerId], references: [customers.id] }),
}));
export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, { fields: [customerAddresses.customerId], references: [customers.id] }),
}));
