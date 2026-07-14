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
]);
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

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),
    orderNumber: varchar("order_number", { length: 50 }).notNull(),
    customerEmail: varchar("customer_email", { length: 254 }).notNull(),
    status: orderStatusEnum("status").default("pending_payment").notNull(),
    currency: varchar("currency", { length: 3 }).default("PKR").notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    discountTotal: numeric("discount_total", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    shippingTotal: numeric("shipping_total", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("orders_store_number_unique").on(
      table.storeId,
      table.orderNumber,
    ),
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
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 180 }).notNull(),
    variantName: varchar("variant_name", { length: 180 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
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
  settings: one(storeSettings),
  assets: many(storeAssets),
  themeConfigurations: many(storeThemeConfigurations),
  categories: many(productCategories),
  collections: many(collections),
  products: many(products),
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
