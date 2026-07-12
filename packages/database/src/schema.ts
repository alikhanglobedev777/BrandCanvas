import {
  boolean,
  check,
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const platformRoleEnum = pgEnum("platform_role", ["super_admin", "user"]);
export const userStatusEnum = pgEnum("user_status", ["active", "blocked"]);
export const storeStatusEnum = pgEnum("store_status", ["pending", "active", "inactive", "suspended", "archived"]);
export const storeMemberRoleEnum = pgEnum("store_member_role", [
  "owner",
  "admin",
  "catalog_manager",
  "inventory_manager",
  "order_manager",
  "support_agent",
]);
export const productStatusEnum = pgEnum("product_status", ["draft", "active", "inactive", "archived"]);
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
  "sale",
  "return",
  "order_cancelled",
  "damaged",
  "manual_increase",
  "manual_decrease",
  "reservation",
  "reservation_release",
]);
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
    deactivatedBy: uuid("deactivated_by").references(() => users.id, { onDelete: "set null" }),
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
    uniqueIndex("store_members_store_user_unique").on(table.storeId, table.userId),
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
    facebookUrl: text("facebook_url"),
    instagramUrl: text("instagram_url"),
    youtubeUrl: text("youtube_url"),
    tiktokUrl: text("tiktok_url"),
    xUrl: text("x_url"),
    ...timestamps,
  },
  (table) => [uniqueIndex("store_settings_store_unique").on(table.storeId)],
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
    status: productStatusEnum("status").default("draft").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_store_slug_unique").on(table.storeId, table.slug),
    index("products_store_status_idx").on(table.storeId, table.status),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    compareAtPrice: numeric("compare_at_price", { precision: 12, scale: 2 }),
    isDefault: boolean("is_default").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("product_variants_store_sku_unique").on(table.storeId, table.sku),
    index("product_variants_product_idx").on(table.productId),
    check("product_variants_price_nonnegative", sql`${table.price} >= 0`),
  ],
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    reservedQuantity: integer("reserved_quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
    allowBackorder: boolean("allow_backorder").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("inventory_items_variant_unique").on(table.variantId),
    index("inventory_items_store_idx").on(table.storeId),
    check("inventory_stock_nonnegative", sql`${table.stockQuantity} >= 0`),
    check("inventory_reserved_nonnegative", sql`${table.reservedQuantity} >= 0`),
    check("inventory_reserved_not_above_stock", sql`${table.reservedQuantity} <= ${table.stockQuantity}`),
  ],
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    type: inventoryMovementTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(),
    previousQuantity: integer("previous_quantity").notNull(),
    newQuantity: integer("new_quantity").notNull(),
    reason: text("reason"),
    referenceType: varchar("reference_type", { length: 50 }),
    referenceId: uuid("reference_id"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("inventory_movements_item_created_idx").on(table.inventoryItemId, table.createdAt)],
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
    discountTotal: numeric("discount_total", { precision: 12, scale: 2 }).default("0").notNull(),
    shippingTotal: numeric("shipping_total", { precision: 12, scale: 2 }).default("0").notNull(),
    grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("orders_store_number_unique").on(table.storeId, table.orderNumber),
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
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    productName: varchar("product_name", { length: 180 }).notNull(),
    variantName: varchar("variant_name", { length: 180 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId), index("sessions_store_idx").on(table.storeId)],
);

export const storesRelations = relations(stores, ({ many, one }) => ({
  owner: one(users, { fields: [stores.ownerId], references: [users.id] }),
  members: many(storeMembers),
  settings: one(storeSettings),
  assets: many(storeAssets),
  themeConfigurations: many(storeThemeConfigurations),
}));

export const storeSettingsRelations = relations(storeSettings, ({ one }) => ({
  store: one(stores, { fields: [storeSettings.storeId], references: [stores.id] }),
}));

export const storeAssetsRelations = relations(storeAssets, ({ one }) => ({
  store: one(stores, { fields: [storeAssets.storeId], references: [stores.id] }),
}));

export const storeThemeConfigurationsRelations = relations(storeThemeConfigurations, ({ one }) => ({
  store: one(stores, { fields: [storeThemeConfigurations.storeId], references: [stores.id] }),
}));
