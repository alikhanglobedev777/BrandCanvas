import { readFileSync } from "node:fs";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  collectionProducts,
  inventoryItems,
  inventoryMovements,
  inventoryMovementTypeEnum,
  inventoryReservations,
  productCategories,
  productOptions,
  productOptionValues,
  productImages,
  products,
  productVariants,
  productVariantValues,
} from "./schema";

function foreignKeySignatures(table: PgTable) {
  return getTableConfig(table).foreignKeys.map((foreignKey) => {
    const reference = foreignKey.reference();
    return {
      columns: reference.columns.map((column) => column.name),
      foreignColumns: reference.foreignColumns.map((column) => column.name),
      foreignTable: getTableConfig(reference.foreignTable).name,
    };
  });
}

describe("catalog schema tenant integrity", () => {
  it.each([
    [productCategories, ["store_id", "image_asset_id"], "store_assets"],
    [products, ["store_id", "category_id"], "product_categories"],
    [collectionProducts, ["store_id", "collection_id"], "collections"],
    [collectionProducts, ["store_id", "product_id"], "products"],
    [productOptions, ["store_id", "product_id"], "products"],
    [
      productOptionValues,
      ["store_id", "product_id", "option_id"],
      "product_options",
    ],
    [productVariants, ["store_id", "product_id"], "products"],
    [
      productVariantValues,
      ["store_id", "product_id", "variant_id"],
      "product_variants",
    ],
    [
      productVariantValues,
      ["store_id", "product_id", "option_value_id"],
      "product_option_values",
    ],
    [
      inventoryItems,
      ["store_id", "product_id", "variant_id"],
      "product_variants",
    ],
    [inventoryMovements, ["store_id", "inventory_item_id"], "inventory_items"],
    [inventoryMovements, ["store_id", "product_id"], "products"],
    [
      inventoryMovements,
      ["store_id", "product_id", "variant_id"],
      "product_variants",
    ],
    [productImages, ["store_id", "product_id"], "products"],
    [
      productImages,
      ["store_id", "product_id", "variant_id"],
      "product_variants",
    ],
    [
      inventoryReservations,
      ["store_id", "inventory_item_id"],
      "inventory_items",
    ],
    [inventoryReservations, ["store_id", "product_id"], "products"],
    [
      inventoryReservations,
      ["store_id", "product_id", "variant_id"],
      "product_variants",
    ],
  ] as const)(
    "%s has a tenant-scoped relationship through %s",
    (table, columns, foreignTable) => {
      expect(foreignKeySignatures(table)).toContainEqual(
        expect.objectContaining({ columns: [...columns], foreignTable }),
      );
    },
  );

  it("stores catalog prices only as integer minor-unit columns", () => {
    const variantColumns = getTableConfig(productVariants).columns.map(
      (column) => column.name,
    );
    expect(variantColumns).not.toContain("price");
    expect(variantColumns).not.toContain("compare_at_price");
    expect(
      getTableConfig(products).columns.map((column) => column.name),
    ).toEqual(
      expect.arrayContaining(["price_minor", "compare_at_price_minor"]),
    );
  });

  it("supports the complete inventory ledger movement taxonomy", () => {
    expect(inventoryMovementTypeEnum.enumValues).toEqual(
      expect.arrayContaining([
        "initial_stock",
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
      ]),
    );
  });

  it("creates normalized image and reservation columns", () => {
    expect(
      getTableConfig(productImages).columns.map((column) => column.name),
    ).toEqual(
      expect.arrayContaining([
        "product_id",
        "variant_id",
        "storage_key",
        "public_url",
        "position",
        "is_primary",
      ]),
    );
    expect(
      getTableConfig(inventoryReservations).columns.map(
        (column) => column.name,
      ),
    ).toEqual(
      expect.arrayContaining([
        "inventory_item_id",
        "idempotency_key",
        "expires_at",
        "released_at",
      ]),
    );
  });

  it("installs an immutable inventory movement trigger", () => {
    const migration = readFileSync(
      new URL("../drizzle/0007_lean_santa_claus.sql", import.meta.url),
      "utf8",
    );
    expect(migration).toContain("prevent_inventory_movement_mutation");
    expect(migration).toContain("BEFORE UPDATE OR DELETE");
  });
});
