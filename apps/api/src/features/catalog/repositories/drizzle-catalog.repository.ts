import { Injectable } from "@nestjs/common";
import {
  inventoryItems,
  inventoryMovements,
  products,
  productVariants,
} from "@brandcanvas/database";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import { ProductMapper } from "../mappers";
import type { ProductEntity } from "../entities";
import {
  CatalogRepository,
  type CreateProductPersistenceInput,
  type ProductListInput,
  type ProductListResult,
} from "./catalog.repository";

const selection = {
  id: products.id,
  variantId: productVariants.id,
  inventoryItemId: inventoryItems.id,
  name: products.name,
  slug: products.slug,
  description: products.description,
  status: products.status,
  sku: productVariants.sku,
  priceMinor: products.priceMinor,
  compareAtPriceMinor: products.compareAtPriceMinor,
  stockQuantity: inventoryItems.stockQuantity,
  reservedQuantity: inventoryItems.reservedQuantity,
  lowStockThreshold: inventoryItems.lowStockThreshold,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
};

type ProductRow = {
  id: string;
  variantId: string;
  inventoryItemId: string;
  name: string;
  slug: string;
  description: string | null;
  status: "draft" | "active" | "inactive" | "archived";
  sku: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class DrizzleCatalogRepository implements CatalogRepository {
  constructor(private readonly database: DatabaseService) {}

  async findMany(input: ProductListInput): Promise<ProductListResult> {
    const availableSql = sql<number>`${inventoryItems.stockQuantity} - ${inventoryItems.reservedQuantity}`;
    const search = input.search?.trim();
    const conditions = [
      eq(products.storeId, input.storeId),
      eq(productVariants.isDefault, true),
      input.status ? eq(products.status, input.status) : undefined,
      search
        ? or(
            ilike(products.name, `%${search}%`),
            ilike(productVariants.sku, `%${search}%`),
          )
        : undefined,
      input.stockStatus === "out_of_stock"
        ? sql`${availableSql} <= 0`
        : undefined,
      input.stockStatus === "low_stock"
        ? sql`${availableSql} > 0 and ${availableSql} <= ${inventoryItems.lowStockThreshold}`
        : undefined,
      input.stockStatus === "in_stock"
        ? sql`${availableSql} > ${inventoryItems.lowStockThreshold}`
        : undefined,
    ].filter((condition): condition is NonNullable<typeof condition> =>
      Boolean(condition),
    );
    const where = and(...conditions);

    const [rows, totals] = await Promise.all([
      this.database.db
        .select(selection)
        .from(products)
        .innerJoin(productVariants, eq(productVariants.productId, products.id))
        .innerJoin(
          inventoryItems,
          eq(inventoryItems.variantId, productVariants.id),
        )
        .where(where)
        .orderBy(desc(products.createdAt))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      this.database.db
        .select({ total: count() })
        .from(products)
        .innerJoin(productVariants, eq(productVariants.productId, products.id))
        .innerJoin(
          inventoryItems,
          eq(inventoryItems.variantId, productVariants.id),
        )
        .where(where),
    ]);

    return {
      items: rows.map((row) => this.toEntity(row)),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async create(input: CreateProductPersistenceInput): Promise<ProductEntity> {
    return this.database.db.transaction(async (tx) => {
      const [product] = await tx
        .insert(products)
        .values({
          storeId: input.storeId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          status: input.status,
          priceMinor: input.priceMinor,
          compareAtPriceMinor: input.compareAtPriceMinor ?? null,
        })
        .returning();
      if (!product) throw new Error("Failed to create product.");

      const [variant] = await tx
        .insert(productVariants)
        .values({
          storeId: input.storeId,
          productId: product.id,
          sku: input.sku,
          title: "Default",
          priceOverrideMinor: input.priceMinor,
          compareAtPriceMinor: input.compareAtPriceMinor ?? null,
          isDefault: true,
        })
        .returning();
      if (!variant) throw new Error("Failed to create product variant.");

      const [inventory] = await tx
        .insert(inventoryItems)
        .values({
          storeId: input.storeId,
          productId: product.id,
          variantId: variant.id,
          stockQuantity: input.initialStock,
          lowStockThreshold: input.lowStockThreshold,
        })
        .returning();
      if (!inventory) throw new Error("Failed to create inventory item.");

      await tx.insert(inventoryMovements).values({
        storeId: input.storeId,
        productId: product.id,
        variantId: variant.id,
        inventoryItemId: inventory.id,
        movementType: "initial_stock",
        quantityDelta: input.initialStock,
        stockBefore: 0,
        stockAfter: input.initialStock,
        reservedBefore: 0,
        reservedAfter: 0,
        reason: "Initial product stock",
        actorUserId: input.createdBy,
      });

      return this.toEntity({
        id: product.id,
        variantId: variant.id,
        inventoryItemId: inventory.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        status: product.status,
        sku: variant.sku,
        priceMinor: product.priceMinor,
        compareAtPriceMinor: product.compareAtPriceMinor,
        stockQuantity: inventory.stockQuantity,
        reservedQuantity: inventory.reservedQuantity,
        lowStockThreshold: inventory.lowStockThreshold,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
    });
  }

  private toEntity(row: ProductRow): ProductEntity {
    const available = Math.max(0, row.stockQuantity - row.reservedQuantity);
    return {
      ...row,
      stockStatus: ProductMapper.getStockStatus(
        available,
        row.lowStockThreshold,
      ),
    };
  }
}
