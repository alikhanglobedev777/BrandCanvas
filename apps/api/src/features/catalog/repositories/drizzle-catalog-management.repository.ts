import { Injectable } from "@nestjs/common";
import {
  collectionProducts,
  collections,
  inventoryItems,
  inventoryMovements,
  productCategories,
  productOptions,
  productOptionValues,
  products,
  productVariants,
  productVariantValues,
  storeAssets,
} from "@brandcanvas/database";
import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
} from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import type {
  CategoryEntity,
  CollectionEntity,
  ProductDetailsEntity,
} from "../entities";
import {
  CatalogManagementRepository,
  type CategoryWrite,
  type CollectionWrite,
  type PageInput,
  type ProductWrite,
  type VariantWrite,
} from "./catalog-management.repository";

@Injectable()
export class DrizzleCatalogManagementRepository extends CatalogManagementRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async storeAssetExists(storeId: string, assetId: string): Promise<boolean> {
    const [row] = await this.database.db
      .select({ id: storeAssets.id })
      .from(storeAssets)
      .where(and(eq(storeAssets.id, assetId), eq(storeAssets.storeId, storeId)))
      .limit(1);
    return Boolean(row);
  }

  async listCategories(input: PageInput & { status?: "active" | "inactive" }) {
    const search = input.search?.trim();
    const where = and(
      eq(productCategories.storeId, input.storeId),
      input.archived
        ? isNotNull(productCategories.archivedAt)
        : isNull(productCategories.archivedAt),
      input.status ? eq(productCategories.status, input.status) : undefined,
      search
        ? or(
            ilike(productCategories.name, `%${search}%`),
            ilike(productCategories.slug, `%${search}%`),
          )
        : undefined,
    );
    const [items, totals] = await Promise.all([
      this.database.db
        .select()
        .from(productCategories)
        .where(where)
        .orderBy(asc(productCategories.sortOrder), asc(productCategories.name))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      this.database.db
        .select({ total: count() })
        .from(productCategories)
        .where(where),
    ]);
    return { items, total: Number(totals[0]?.total ?? 0) };
  }

  async findCategory(
    storeId: string,
    categoryId: string,
  ): Promise<CategoryEntity | null> {
    const [row] = await this.database.db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.id, categoryId),
          eq(productCategories.storeId, storeId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async createCategory(
    storeId: string,
    input: Required<Pick<CategoryWrite, "name" | "slug">> & CategoryWrite,
  ) {
    const [row] = await this.database.db
      .insert(productCategories)
      .values({
        storeId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        imageAssetId: input.imageAssetId,
        sortOrder: input.sortOrder,
        status: input.status,
      })
      .returning();
    if (!row) throw new Error("Failed to create category.");
    return row;
  }

  async updateCategory(
    storeId: string,
    categoryId: string,
    input: CategoryWrite,
  ) {
    const [row] = await this.database.db
      .update(productCategories)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(
          eq(productCategories.id, categoryId),
          eq(productCategories.storeId, storeId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async setCategoryArchived(
    storeId: string,
    categoryId: string,
    archived: boolean,
  ) {
    const [row] = await this.database.db
      .update(productCategories)
      .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
      .where(
        and(
          eq(productCategories.id, categoryId),
          eq(productCategories.storeId, storeId),
        ),
      )
      .returning();
    return row ?? null;
  }

  async listCollections(input: PageInput & { status?: "draft" | "published" }) {
    const search = input.search?.trim();
    const where = and(
      eq(collections.storeId, input.storeId),
      input.archived
        ? isNotNull(collections.archivedAt)
        : isNull(collections.archivedAt),
      input.status ? eq(collections.status, input.status) : undefined,
      search
        ? or(
            ilike(collections.title, `%${search}%`),
            ilike(collections.slug, `%${search}%`),
          )
        : undefined,
    );
    const [rows, totals] = await Promise.all([
      this.database.db
        .select()
        .from(collections)
        .where(where)
        .orderBy(asc(collections.sortOrder), asc(collections.title))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      this.database.db
        .select({ total: count() })
        .from(collections)
        .where(where),
    ]);
    return {
      items: await Promise.all(rows.map((row) => this.hydrateCollection(row))),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async findCollection(
    storeId: string,
    collectionId: string,
  ): Promise<CollectionEntity | null> {
    const [row] = await this.database.db
      .select()
      .from(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.storeId, storeId)),
      )
      .limit(1);
    return row ? this.hydrateCollection(row) : null;
  }

  async createCollection(
    storeId: string,
    input: Required<Pick<CollectionWrite, "title" | "slug">> & CollectionWrite,
  ) {
    const [row] = await this.database.db
      .insert(collections)
      .values({
        storeId,
        title: input.title,
        slug: input.slug,
        description: input.description,
        status: input.status,
        sortOrder: input.sortOrder,
      })
      .returning();
    if (!row) throw new Error("Failed to create collection.");
    return this.hydrateCollection(row);
  }

  async updateCollection(
    storeId: string,
    collectionId: string,
    input: CollectionWrite,
  ) {
    const [row] = await this.database.db
      .update(collections)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(eq(collections.id, collectionId), eq(collections.storeId, storeId)),
      )
      .returning();
    return row ? this.hydrateCollection(row) : null;
  }

  async setCollectionArchived(
    storeId: string,
    collectionId: string,
    archived: boolean,
  ) {
    const [row] = await this.database.db
      .update(collections)
      .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
      .where(
        and(eq(collections.id, collectionId), eq(collections.storeId, storeId)),
      )
      .returning();
    return row ? this.hydrateCollection(row) : null;
  }

  async addCollectionProducts(
    storeId: string,
    collectionId: string,
    productIds: string[],
  ) {
    const collection = await this.findCollection(storeId, collectionId);
    if (!collection) return null;
    const valid = await this.database.db
      .select({ id: products.id })
      .from(products)
      .where(
        and(eq(products.storeId, storeId), inArray(products.id, productIds)),
      );
    if (valid.length !== new Set(productIds).size)
      return "invalid_products" as const;
    const start = collection.products.length;
    await this.database.db
      .insert(collectionProducts)
      .values(
        productIds.map((productId, index) => ({
          storeId,
          collectionId,
          productId,
          sortOrder: start + index,
        })),
      )
      .onConflictDoNothing();
    return this.findCollection(storeId, collectionId);
  }

  async removeCollectionProducts(
    storeId: string,
    collectionId: string,
    productIds: string[],
  ) {
    const collection = await this.findCollection(storeId, collectionId);
    if (!collection) return null;
    await this.database.db
      .delete(collectionProducts)
      .where(
        and(
          eq(collectionProducts.collectionId, collectionId),
          inArray(collectionProducts.productId, productIds),
        ),
      );
    return this.findCollection(storeId, collectionId);
  }

  async reorderCollectionProducts(
    storeId: string,
    collectionId: string,
    productIds: string[],
  ) {
    const collection = await this.findCollection(storeId, collectionId);
    if (!collection) return null;
    const current = collection.products.map((item) => item.productId).sort();
    if (
      productIds.length !== new Set(productIds).size ||
      current.join("|") !== [...productIds].sort().join("|")
    )
      return "invalid_order" as const;
    await this.database.db.transaction(async (tx) => {
      await Promise.all(
        productIds.map((productId, sortOrder) =>
          tx
            .update(collectionProducts)
            .set({ sortOrder })
            .where(
              and(
                eq(collectionProducts.collectionId, collectionId),
                eq(collectionProducts.productId, productId),
              ),
            ),
        ),
      );
    });
    return this.findCollection(storeId, collectionId);
  }

  async findProductDetails(
    storeId: string,
    productId: string,
  ): Promise<ProductDetailsEntity | null> {
    const [product] = await this.database.db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
      .limit(1);
    if (!product) return null;
    const [membershipRows, optionRows, valueRows, variantRows, linkRows] =
      await Promise.all([
        this.database.db
          .select({ collectionId: collectionProducts.collectionId })
          .from(collectionProducts)
          .innerJoin(
            collections,
            eq(collections.id, collectionProducts.collectionId),
          )
          .where(
            and(
              eq(collectionProducts.productId, productId),
              eq(collections.storeId, storeId),
            ),
          ),
        this.database.db
          .select()
          .from(productOptions)
          .where(eq(productOptions.productId, productId))
          .orderBy(asc(productOptions.position)),
        this.database.db
          .select({
            id: productOptionValues.id,
            optionId: productOptionValues.optionId,
            value: productOptionValues.value,
            position: productOptionValues.position,
          })
          .from(productOptionValues)
          .innerJoin(
            productOptions,
            eq(productOptions.id, productOptionValues.optionId),
          )
          .where(eq(productOptions.productId, productId))
          .orderBy(asc(productOptionValues.position)),
        this.database.db
          .select({ variant: productVariants, inventory: inventoryItems })
          .from(productVariants)
          .innerJoin(
            inventoryItems,
            eq(inventoryItems.variantId, productVariants.id),
          )
          .where(
            and(
              eq(productVariants.productId, productId),
              eq(productVariants.storeId, storeId),
            ),
          )
          .orderBy(asc(productVariants.createdAt)),
        this.database.db
          .select({
            variantId: productVariantValues.variantId,
            optionValueId: productVariantValues.optionValueId,
          })
          .from(productVariantValues)
          .innerJoin(
            productVariants,
            eq(productVariants.id, productVariantValues.variantId),
          )
          .where(
            and(
              eq(productVariants.productId, productId),
              eq(productVariants.storeId, storeId),
            ),
          ),
      ]);
    return {
      ...product,
      collectionIds: membershipRows.map((row) => row.collectionId),
      options: optionRows.map((option) => ({
        ...option,
        values: valueRows
          .filter((value) => value.optionId === option.id)
          .map(({ optionId: _optionId, ...value }) => value),
      })),
      variants: variantRows.map(({ variant, inventory }) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        barcode: variant.barcode,
        priceOverrideMinor: variant.priceOverrideMinor,
        compareAtPriceMinor: variant.compareAtPriceMinor,
        costPriceMinor: variant.costPriceMinor,
        stockQuantity: inventory.stockQuantity,
        reservedQuantity: inventory.reservedQuantity,
        lowStockThreshold: inventory.lowStockThreshold,
        isActive: variant.isActive,
        isDefault: variant.isDefault,
        archivedAt: variant.archivedAt,
        optionValueIds: linkRows
          .filter((link) => link.variantId === variant.id)
          .map((link) => link.optionValueId),
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      })),
    };
  }

  async updateProduct(storeId: string, productId: string, input: ProductWrite) {
    return this.database.db
      .transaction(async (tx) => {
        const [existing] = await tx
          .select({ id: products.id })
          .from(products)
          .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
          .limit(1)
          .for("update");
        if (!existing) return null;
        if (input.categoryId) {
          const [category] = await tx
            .select({ id: productCategories.id })
            .from(productCategories)
            .where(
              and(
                eq(productCategories.id, input.categoryId),
                eq(productCategories.storeId, storeId),
              ),
            )
            .limit(1);
          if (!category) return "invalid_category" as const;
        }
        if (input.collectionIds) {
          const valid = input.collectionIds.length
            ? await tx
                .select({ id: collections.id })
                .from(collections)
                .where(
                  and(
                    eq(collections.storeId, storeId),
                    inArray(collections.id, input.collectionIds),
                  ),
                )
            : [];
          if (valid.length !== new Set(input.collectionIds).size)
            return "invalid_collections" as const;
        }
        const { collectionIds, ...values } = input;
        await tx
          .update(products)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(products.id, productId));
        if (collectionIds) {
          await tx
            .delete(collectionProducts)
            .where(eq(collectionProducts.productId, productId));
          if (collectionIds.length)
            await tx.insert(collectionProducts).values(
              collectionIds.map((collectionId, sortOrder) => ({
                storeId,
                collectionId,
                productId,
                sortOrder,
              })),
            );
        }
        return "updated" as const;
      })
      .then(async (result) =>
        result === "updated"
          ? this.findProductDetails(storeId, productId)
          : result,
      );
  }

  async setProductArchived(
    storeId: string,
    productId: string,
    archived: boolean,
  ) {
    const [row] = await this.database.db
      .update(products)
      .set({
        status: archived ? "archived" : "draft",
        archivedAt: archived ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
      .returning({ id: products.id });
    return row ? this.findProductDetails(storeId, productId) : null;
  }

  async createOption(
    storeId: string,
    productId: string,
    input: { name: string; position: number },
  ) {
    if (!(await this.productExists(storeId, productId))) return null;
    await this.database.db
      .insert(productOptions)
      .values({ storeId, productId, ...input });
    return this.findProductDetails(storeId, productId);
  }
  async updateOption(
    storeId: string,
    productId: string,
    optionId: string,
    input: { name?: string; position?: number },
  ) {
    const [row] = await this.database.db
      .update(productOptions)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(
          eq(productOptions.id, optionId),
          eq(productOptions.productId, productId),
        ),
      )
      .returning({ id: productOptions.id });
    return row && (await this.productExists(storeId, productId))
      ? this.findProductDetails(storeId, productId)
      : null;
  }
  async deleteOption(storeId: string, productId: string, optionId: string) {
    if (!(await this.productExists(storeId, productId))) return null;
    const [row] = await this.database.db
      .delete(productOptions)
      .where(
        and(
          eq(productOptions.id, optionId),
          eq(productOptions.productId, productId),
        ),
      )
      .returning({ id: productOptions.id });
    return row ? this.findProductDetails(storeId, productId) : null;
  }
  async createOptionValue(
    storeId: string,
    productId: string,
    optionId: string,
    input: { value: string; position: number },
  ) {
    if (!(await this.optionExists(storeId, productId, optionId))) return null;
    await this.database.db
      .insert(productOptionValues)
      .values({ storeId, productId, optionId, ...input });
    return this.findProductDetails(storeId, productId);
  }
  async updateOptionValue(
    storeId: string,
    productId: string,
    valueId: string,
    input: { value?: string; position?: number },
  ) {
    if (!(await this.productExists(storeId, productId))) return null;
    const [row] = await this.database.db
      .update(productOptionValues)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(
          eq(productOptionValues.id, valueId),
          inArray(
            productOptionValues.optionId,
            this.database.db
              .select({ id: productOptions.id })
              .from(productOptions)
              .where(eq(productOptions.productId, productId)),
          ),
        ),
      )
      .returning({ id: productOptionValues.id });
    return row ? this.findProductDetails(storeId, productId) : null;
  }
  async deleteOptionValue(storeId: string, productId: string, valueId: string) {
    if (!(await this.productExists(storeId, productId))) return null;
    const [row] = await this.database.db
      .delete(productOptionValues)
      .where(
        and(
          eq(productOptionValues.id, valueId),
          inArray(
            productOptionValues.optionId,
            this.database.db
              .select({ id: productOptions.id })
              .from(productOptions)
              .where(eq(productOptions.productId, productId)),
          ),
        ),
      )
      .returning({ id: productOptionValues.id });
    return row ? this.findProductDetails(storeId, productId) : null;
  }

  async createVariant(
    storeId: string,
    productId: string,
    input: Required<
      Pick<
        VariantWrite,
        | "title"
        | "sku"
        | "stockQuantity"
        | "lowStockThreshold"
        | "optionValueIds"
        | "createdBy"
      >
    > &
      VariantWrite,
  ) {
    if (!(await this.productExists(storeId, productId))) return null;
    const validation = await this.validateCombination(
      storeId,
      productId,
      input.optionValueIds,
    );
    if (validation !== "valid") return validation;
    await this.database.db.transaction(async (tx) => {
      const [variant] = await tx
        .insert(productVariants)
        .values({
          storeId,
          productId,
          title: input.title,
          sku: input.sku,
          barcode: input.barcode,
          priceOverrideMinor: input.priceOverrideMinor,
          compareAtPriceMinor: input.compareAtPriceMinor,
          costPriceMinor: input.costPriceMinor,
          isActive: input.isActive ?? true,
        })
        .returning();
      if (!variant) throw new Error("Failed to create variant.");
      const [inventory] = await tx
        .insert(inventoryItems)
        .values({
          storeId,
          productId,
          variantId: variant.id,
          stockQuantity: input.stockQuantity,
          lowStockThreshold: input.lowStockThreshold,
        })
        .returning();
      if (!inventory) throw new Error("Failed to create variant inventory.");
      await tx.insert(inventoryMovements).values({
        storeId,
        productId,
        variantId: variant.id,
        inventoryItemId: inventory.id,
        movementType: "initial_stock",
        quantityDelta: input.stockQuantity,
        stockBefore: 0,
        stockAfter: input.stockQuantity,
        reservedBefore: 0,
        reservedAfter: 0,
        reason: "Initial variant stock",
        actorUserId: input.createdBy,
      });
      if (input.optionValueIds.length)
        await tx.insert(productVariantValues).values(
          input.optionValueIds.map((optionValueId) => ({
            storeId,
            productId,
            variantId: variant.id,
            optionValueId,
          })),
        );
    });
    return this.findProductDetails(storeId, productId);
  }

  async updateVariant(
    storeId: string,
    productId: string,
    variantId: string,
    input: VariantWrite,
  ) {
    if (!(await this.productExists(storeId, productId))) return null;
    if (input.optionValueIds) {
      const validation = await this.validateCombination(
        storeId,
        productId,
        input.optionValueIds,
        variantId,
      );
      if (validation !== "valid") return validation;
    }
    const result = await this.database.db.transaction(async (tx) => {
      const [current] = await tx
        .select({
          id: productVariants.id,
          inventoryItemId: inventoryItems.id,
          stockQuantity: inventoryItems.stockQuantity,
          reservedQuantity: inventoryItems.reservedQuantity,
        })
        .from(productVariants)
        .innerJoin(
          inventoryItems,
          eq(inventoryItems.variantId, productVariants.id),
        )
        .where(
          and(
            eq(productVariants.id, variantId),
            eq(productVariants.productId, productId),
            eq(productVariants.storeId, storeId),
          ),
        )
        .limit(1)
        .for("update");
      if (!current) return "not_found" as const;
      if (
        input.stockQuantity !== undefined &&
        input.stockQuantity < current.reservedQuantity
      )
        return "reserved_stock" as const;
      const {
        stockQuantity,
        lowStockThreshold,
        optionValueIds,
        createdBy,
        ...variant
      } = input;
      await tx
        .update(productVariants)
        .set({
          ...variant,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, variantId));
      if (stockQuantity !== undefined || lowStockThreshold !== undefined)
        await tx
          .update(inventoryItems)
          .set({
            ...(stockQuantity !== undefined ? { stockQuantity } : {}),
            ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
            updatedAt: new Date(),
          })
          .where(eq(inventoryItems.variantId, variantId));
      if (
        (stockQuantity !== undefined &&
          stockQuantity !== current.stockQuantity) ||
        lowStockThreshold !== undefined
      )
        await tx.insert(inventoryMovements).values({
          storeId,
          productId,
          variantId,
          inventoryItemId: current.inventoryItemId,
          movementType:
            stockQuantity === undefined ||
            stockQuantity === current.stockQuantity
              ? "correction"
              : "set_quantity",
          quantityDelta:
            (stockQuantity ?? current.stockQuantity) - current.stockQuantity,
          stockBefore: current.stockQuantity,
          stockAfter: stockQuantity ?? current.stockQuantity,
          reservedBefore: current.reservedQuantity,
          reservedAfter: current.reservedQuantity,
          reason: "Variant inventory updated",
          actorUserId: createdBy,
          metadata:
            lowStockThreshold === undefined
              ? {}
              : { newLowStockThreshold: lowStockThreshold },
        });
      if (optionValueIds) {
        await tx
          .delete(productVariantValues)
          .where(eq(productVariantValues.variantId, variantId));
        if (optionValueIds.length)
          await tx.insert(productVariantValues).values(
            optionValueIds.map((optionValueId) => ({
              storeId,
              productId,
              variantId,
              optionValueId,
            })),
          );
      }
      return "updated" as const;
    });
    if (result === "reserved_stock") return result;
    return result === "not_found"
      ? null
      : this.findProductDetails(storeId, productId);
  }

  async archiveVariant(storeId: string, productId: string, variantId: string) {
    const [row] = await this.database.db
      .update(productVariants)
      .set({ isActive: false, archivedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(productVariants.id, variantId),
          eq(productVariants.productId, productId),
          eq(productVariants.storeId, storeId),
          eq(productVariants.isDefault, false),
        ),
      )
      .returning({ id: productVariants.id });
    return row ? this.findProductDetails(storeId, productId) : null;
  }

  private async hydrateCollection(
    row: typeof collections.$inferSelect,
  ): Promise<CollectionEntity> {
    const assigned = await this.database.db
      .select({
        productId: products.id,
        name: products.name,
        sortOrder: collectionProducts.sortOrder,
      })
      .from(collectionProducts)
      .innerJoin(products, eq(products.id, collectionProducts.productId))
      .where(eq(collectionProducts.collectionId, row.id))
      .orderBy(asc(collectionProducts.sortOrder));
    return { ...row, products: assigned };
  }
  private async productExists(storeId: string, productId: string) {
    const [row] = await this.database.db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.storeId, storeId)))
      .limit(1);
    return Boolean(row);
  }
  private async optionExists(
    storeId: string,
    productId: string,
    optionId: string,
  ) {
    const [row] = await this.database.db
      .select({ id: productOptions.id })
      .from(productOptions)
      .innerJoin(products, eq(products.id, productOptions.productId))
      .where(
        and(
          eq(productOptions.id, optionId),
          eq(productOptions.productId, productId),
          eq(products.storeId, storeId),
        ),
      )
      .limit(1);
    return Boolean(row);
  }
  private async validateCombination(
    storeId: string,
    productId: string,
    valueIds: string[],
    excludedVariantId?: string,
  ): Promise<"valid" | "invalid_values" | "duplicate_combination"> {
    if (new Set(valueIds).size !== valueIds.length) return "invalid_values";
    const optionRows = await this.database.db
      .select({ id: productOptions.id })
      .from(productOptions)
      .innerJoin(products, eq(products.id, productOptions.productId))
      .where(
        and(
          eq(productOptions.productId, productId),
          eq(products.storeId, storeId),
        ),
      );
    if (valueIds.length !== optionRows.length) return "invalid_values";
    const values = valueIds.length
      ? await this.database.db
          .select({
            id: productOptionValues.id,
            optionId: productOptionValues.optionId,
          })
          .from(productOptionValues)
          .innerJoin(
            productOptions,
            eq(productOptions.id, productOptionValues.optionId),
          )
          .innerJoin(products, eq(products.id, productOptions.productId))
          .where(
            and(
              eq(productOptions.productId, productId),
              eq(products.storeId, storeId),
              inArray(productOptionValues.id, valueIds),
            ),
          )
      : [];
    if (
      values.length !== valueIds.length ||
      new Set(values.map((value) => value.optionId)).size !== values.length
    )
      return "invalid_values";
    const [variantRows, links] = await Promise.all([
      this.database.db
        .select({ id: productVariants.id })
        .from(productVariants)
        .where(
          and(
            eq(productVariants.productId, productId),
            eq(productVariants.storeId, storeId),
          ),
        ),
      this.database.db
        .select({
          variantId: productVariantValues.variantId,
          optionValueId: productVariantValues.optionValueId,
        })
        .from(productVariantValues)
        .innerJoin(
          productVariants,
          eq(productVariants.id, productVariantValues.variantId),
        )
        .where(
          and(
            eq(productVariants.productId, productId),
            eq(productVariants.storeId, storeId),
          ),
        ),
    ]);
    const byVariant = new Map<string, string[]>(
      variantRows.map((variant) => [variant.id, []]),
    );
    for (const link of links)
      byVariant.set(link.variantId, [
        ...(byVariant.get(link.variantId) ?? []),
        link.optionValueId,
      ]);
    const signature = [...valueIds].sort().join("|");
    for (const [variantId, ids] of byVariant)
      if (
        variantId !== excludedVariantId &&
        [...ids].sort().join("|") === signature
      )
        return "duplicate_combination";
    return "valid";
  }
}
