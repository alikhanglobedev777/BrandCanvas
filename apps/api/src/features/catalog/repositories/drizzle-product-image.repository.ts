import { Injectable } from "@nestjs/common";
import {
  productImages,
  products,
  productVariants,
} from "@brandcanvas/database";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import type { ProductImageEntity } from "../entities";
import {
  ProductImageRepository,
  type CreateProductImageInput,
} from "./product-image.repository";

@Injectable()
export class DrizzleProductImageRepository extends ProductImageRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async productExists(storeId: string, productId: string) {
    const [row] = await this.database.db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.storeId, storeId), eq(products.id, productId)))
      .limit(1);
    return Boolean(row);
  }

  async variantExists(storeId: string, productId: string, variantId: string) {
    const [row] = await this.database.db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.storeId, storeId),
          eq(productVariants.productId, productId),
          eq(productVariants.id, variantId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  async list(
    storeId: string,
    productId: string,
  ): Promise<ProductImageEntity[]> {
    return this.database.db
      .select()
      .from(productImages)
      .where(
        and(
          eq(productImages.storeId, storeId),
          eq(productImages.productId, productId),
        ),
      )
      .orderBy(asc(productImages.position), asc(productImages.createdAt));
  }

  async find(storeId: string, productId: string, imageId: string) {
    const [row] = await this.database.db
      .select()
      .from(productImages)
      .where(
        and(
          eq(productImages.storeId, storeId),
          eq(productImages.productId, productId),
          eq(productImages.id, imageId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async create(input: CreateProductImageInput): Promise<ProductImageEntity> {
    const imageId = await this.database.db.transaction(async (tx) => {
      const [product] = await tx
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.storeId, input.storeId),
            eq(products.id, input.productId),
          ),
        )
        .limit(1)
        .for("update");
      if (!product) throw new Error("Product disappeared during image upload.");

      const existing = await tx
        .select({ position: productImages.position })
        .from(productImages)
        .where(
          and(
            eq(productImages.storeId, input.storeId),
            eq(productImages.productId, input.productId),
          ),
        )
        .orderBy(asc(productImages.position));
      const position = existing.length;
      const [image] = await tx
        .insert(productImages)
        .values({
          ...input,
          position,
          isPrimary: position === 0,
        })
        .returning({ id: productImages.id });
      if (!image) throw new Error("Failed to create product image.");
      return image.id;
    });
    const image = await this.find(input.storeId, input.productId, imageId);
    if (!image) throw new Error("Created product image could not be loaded.");
    return image;
  }

  async update(
    storeId: string,
    productId: string,
    imageId: string,
    input: { altText?: string | null; variantId?: string | null },
  ) {
    const [row] = await this.database.db
      .update(productImages)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(
          eq(productImages.storeId, storeId),
          eq(productImages.productId, productId),
          eq(productImages.id, imageId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async reorder(storeId: string, productId: string, imageIds: string[]) {
    const result = await this.database.db.transaction(async (tx) => {
      const [product] = await tx
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.storeId, storeId), eq(products.id, productId)))
        .limit(1)
        .for("update");
      if (!product) return null;

      const rows = await tx
        .select({ id: productImages.id })
        .from(productImages)
        .where(
          and(
            eq(productImages.storeId, storeId),
            eq(productImages.productId, productId),
          ),
        );
      const current = rows.map((row) => row.id).sort();
      if (
        imageIds.length !== new Set(imageIds).size ||
        current.join("|") !== [...imageIds].sort().join("|")
      )
        return "invalid_order" as const;

      await tx
        .update(productImages)
        .set({ position: sql`${productImages.position} + 1000` })
        .where(
          and(
            eq(productImages.storeId, storeId),
            eq(productImages.productId, productId),
            inArray(productImages.id, imageIds),
          ),
        );
      for (const [position, imageId] of imageIds.entries())
        await tx
          .update(productImages)
          .set({ position, updatedAt: new Date() })
          .where(
            and(
              eq(productImages.storeId, storeId),
              eq(productImages.productId, productId),
              eq(productImages.id, imageId),
            ),
          );
      return "updated" as const;
    });
    if (result === null || result === "invalid_order") return result;
    return this.list(storeId, productId);
  }

  async setPrimary(storeId: string, productId: string, imageId: string) {
    const updated = await this.database.db.transaction(async (tx) => {
      const [target] = await tx
        .select({ id: productImages.id })
        .from(productImages)
        .where(
          and(
            eq(productImages.storeId, storeId),
            eq(productImages.productId, productId),
            eq(productImages.id, imageId),
          ),
        )
        .limit(1)
        .for("update");
      if (!target) return false;
      await tx
        .update(productImages)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(
          and(
            eq(productImages.storeId, storeId),
            eq(productImages.productId, productId),
            eq(productImages.isPrimary, true),
          ),
        );
      await tx
        .update(productImages)
        .set({ isPrimary: true, updatedAt: new Date() })
        .where(eq(productImages.id, imageId));
      return true;
    });
    return updated ? this.list(storeId, productId) : null;
  }

  async delete(storeId: string, productId: string, imageId: string) {
    return this.database.db.transaction(async (tx) => {
      const [image] = await tx
        .select()
        .from(productImages)
        .where(
          and(
            eq(productImages.storeId, storeId),
            eq(productImages.productId, productId),
            eq(productImages.id, imageId),
          ),
        )
        .limit(1)
        .for("update");
      if (!image) return null;
      await tx.delete(productImages).where(eq(productImages.id, imageId));
      await tx
        .update(productImages)
        .set({
          position: sql`${productImages.position} + 1000`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productImages.storeId, storeId),
            eq(productImages.productId, productId),
            sql`${productImages.position} > ${image.position}`,
          ),
        );
      await tx
        .update(productImages)
        .set({
          position: sql`${productImages.position} - 1001`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productImages.storeId, storeId),
            eq(productImages.productId, productId),
            sql`${productImages.position} > ${image.position + 1000}`,
          ),
        );
      if (image.isPrimary) {
        const [next] = await tx
          .select({ id: productImages.id })
          .from(productImages)
          .where(
            and(
              eq(productImages.storeId, storeId),
              eq(productImages.productId, productId),
            ),
          )
          .orderBy(asc(productImages.position))
          .limit(1);
        if (next)
          await tx
            .update(productImages)
            .set({ isPrimary: true, updatedAt: new Date() })
            .where(eq(productImages.id, next.id));
      }
      return image;
    });
  }
}
