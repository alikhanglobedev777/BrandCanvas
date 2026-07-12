import { Injectable } from "@nestjs/common";
import { inventoryItems, inventoryMovements, products, productVariants } from "@brandcanvas/database";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import { ProductMapper } from "../mappers";
import type { ProductEntity } from "../entities";
import {
  CatalogRepository,
  type CreateProductPersistenceInput,
  type InventoryAdjustmentResult,
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
  price: productVariants.price,
  compareAtPrice: productVariants.compareAtPrice,
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
  price: string;
  compareAtPrice: string | null;
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
      search ? or(ilike(products.name, `%${search}%`), ilike(productVariants.sku, `%${search}%`)) : undefined,
      input.stockStatus === "out_of_stock" ? sql`${availableSql} <= 0` : undefined,
      input.stockStatus === "low_stock" ? sql`${availableSql} > 0 and ${availableSql} <= ${inventoryItems.lowStockThreshold}` : undefined,
      input.stockStatus === "in_stock" ? sql`${availableSql} > ${inventoryItems.lowStockThreshold}` : undefined,
    ].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));
    const where = and(...conditions);

    const [rows, totals] = await Promise.all([
      this.database.db
        .select(selection)
        .from(products)
        .innerJoin(productVariants, eq(productVariants.productId, products.id))
        .innerJoin(inventoryItems, eq(inventoryItems.variantId, productVariants.id))
        .where(where)
        .orderBy(desc(products.createdAt))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      this.database.db
        .select({ total: count() })
        .from(products)
        .innerJoin(productVariants, eq(productVariants.productId, products.id))
        .innerJoin(inventoryItems, eq(inventoryItems.variantId, productVariants.id))
        .where(where),
    ]);

    return { items: rows.map((row) => this.toEntity(row)), total: Number(totals[0]?.total ?? 0) };
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
        })
        .returning();
      if (!product) throw new Error("Failed to create product.");

      const [variant] = await tx
        .insert(productVariants)
        .values({
          storeId: input.storeId,
          productId: product.id,
          name: "Default",
          sku: input.sku,
          price: input.price,
          compareAtPrice: input.compareAtPrice,
          isDefault: true,
        })
        .returning();
      if (!variant) throw new Error("Failed to create product variant.");

      const [inventory] = await tx
        .insert(inventoryItems)
        .values({
          storeId: input.storeId,
          variantId: variant.id,
          stockQuantity: input.initialStock,
          lowStockThreshold: input.lowStockThreshold,
        })
        .returning();
      if (!inventory) throw new Error("Failed to create inventory item.");

      if (input.initialStock > 0) {
        await tx.insert(inventoryMovements).values({
          storeId: input.storeId,
          inventoryItemId: inventory.id,
          type: "initial_stock",
          quantity: input.initialStock,
          previousQuantity: 0,
          newQuantity: input.initialStock,
          reason: "Initial product stock",
          createdBy: input.createdBy,
        });
      }

      return this.toEntity({
        id: product.id,
        variantId: variant.id,
        inventoryItemId: inventory.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        status: product.status,
        sku: variant.sku,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        stockQuantity: inventory.stockQuantity,
        reservedQuantity: inventory.reservedQuantity,
        lowStockThreshold: inventory.lowStockThreshold,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
    });
  }

  async adjustInventory(input: {
    storeId: string;
    inventoryItemId: string;
    type: "manual_increase" | "manual_decrease";
    quantity: number;
    reason: string;
    createdBy: string;
  }): Promise<InventoryAdjustmentResult> {
    return this.database.db.transaction(async (tx) => {
      const [row] = await tx
        .select(selection)
        .from(inventoryItems)
        .innerJoin(productVariants, eq(productVariants.id, inventoryItems.variantId))
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(and(eq(inventoryItems.id, input.inventoryItemId), eq(inventoryItems.storeId, input.storeId)))
        .limit(1)
        .for("update");

      if (!row) return { status: "not_found" };

      const delta = input.type === "manual_increase" ? input.quantity : -input.quantity;
      const nextQuantity = row.stockQuantity + delta;
      if (nextQuantity < row.reservedQuantity || nextQuantity < 0) return { status: "insufficient_stock" };

      await tx
        .update(inventoryItems)
        .set({ stockQuantity: nextQuantity, updatedAt: new Date() })
        .where(eq(inventoryItems.id, input.inventoryItemId));

      await tx.insert(inventoryMovements).values({
        storeId: input.storeId,
        inventoryItemId: input.inventoryItemId,
        type: input.type,
        quantity: delta,
        previousQuantity: row.stockQuantity,
        newQuantity: nextQuantity,
        reason: input.reason,
        createdBy: input.createdBy,
      });

      return {
        status: "success",
        product: this.toEntity({ ...row, stockQuantity: nextQuantity, updatedAt: new Date() }),
      };
    });
  }

  private toEntity(row: ProductRow): ProductEntity {
    const available = Math.max(0, row.stockQuantity - row.reservedQuantity);
    return {
      ...row,
      stockStatus: ProductMapper.getStockStatus(available, row.lowStockThreshold),
    };
  }
}
