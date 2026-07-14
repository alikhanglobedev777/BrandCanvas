import { Injectable } from "@nestjs/common";
import {
  inventoryItems,
  inventoryMovements,
  inventoryReservations,
  products,
  productVariants,
  users,
} from "@brandcanvas/database";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import type { InventoryItemEntity, InventoryMovementEntity } from "../entities";
import {
  InventoryRepository,
  type InventoryPageInput,
} from "./inventory.repository";

const itemSelection = {
  id: inventoryItems.id,
  storeId: inventoryItems.storeId,
  productId: inventoryItems.productId,
  productName: products.name,
  productArchivedAt: products.archivedAt,
  variantId: inventoryItems.variantId,
  variantTitle: productVariants.title,
  variantArchivedAt: productVariants.archivedAt,
  variantIsActive: productVariants.isActive,
  sku: productVariants.sku,
  stockQuantity: inventoryItems.stockQuantity,
  reservedQuantity: inventoryItems.reservedQuantity,
  lowStockThreshold: inventoryItems.lowStockThreshold,
  createdAt: inventoryItems.createdAt,
  updatedAt: inventoryItems.updatedAt,
};

@Injectable()
export class DrizzleInventoryRepository extends InventoryRepository {
  constructor(private readonly database: DatabaseService) {
    super();
  }

  async list(input: InventoryPageInput) {
    const available = sql<number>`${inventoryItems.stockQuantity} - ${inventoryItems.reservedQuantity}`;
    const search = input.search?.trim();
    const where = and(
      eq(inventoryItems.storeId, input.storeId),
      input.productId
        ? eq(inventoryItems.productId, input.productId)
        : undefined,
      search
        ? or(
            ilike(products.name, `%${search}%`),
            ilike(productVariants.title, `%${search}%`),
            ilike(productVariants.sku, `%${search}%`),
          )
        : undefined,
      input.stockStatus === "out_of_stock" ? sql`${available} <= 0` : undefined,
      input.stockStatus === "low_stock"
        ? sql`${available} > 0 and ${available} <= ${inventoryItems.lowStockThreshold}`
        : undefined,
      input.stockStatus === "in_stock"
        ? sql`${available} > ${inventoryItems.lowStockThreshold}`
        : undefined,
    );
    const base = () =>
      this.database.db
        .select(itemSelection)
        .from(inventoryItems)
        .innerJoin(products, eq(products.id, inventoryItems.productId))
        .innerJoin(
          productVariants,
          eq(productVariants.id, inventoryItems.variantId),
        );
    const [items, totals] = await Promise.all([
      base()
        .where(where)
        .orderBy(asc(products.name), asc(productVariants.title))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      this.database.db
        .select({ total: count() })
        .from(inventoryItems)
        .innerJoin(products, eq(products.id, inventoryItems.productId))
        .innerJoin(
          productVariants,
          eq(productVariants.id, inventoryItems.variantId),
        )
        .where(where),
    ]);
    return { items, total: Number(totals[0]?.total ?? 0) };
  }

  async listProduct(storeId: string, productId: string) {
    const [product] = await this.database.db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.storeId, storeId), eq(products.id, productId)))
      .limit(1);
    if (!product) return null;
    return this.database.db
      .select(itemSelection)
      .from(inventoryItems)
      .innerJoin(products, eq(products.id, inventoryItems.productId))
      .innerJoin(
        productVariants,
        eq(productVariants.id, inventoryItems.variantId),
      )
      .where(
        and(
          eq(inventoryItems.storeId, storeId),
          eq(inventoryItems.productId, productId),
        ),
      )
      .orderBy(desc(productVariants.isDefault), asc(productVariants.title));
  }

  async listMovements(input: {
    storeId: string;
    inventoryItemId: string;
    page: number;
    pageSize: number;
    movementType?: string;
  }) {
    const [owned] = await this.database.db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.storeId, input.storeId),
          eq(inventoryItems.id, input.inventoryItemId),
        ),
      )
      .limit(1);
    if (!owned) return null;
    const where = and(
      eq(inventoryMovements.storeId, input.storeId),
      eq(inventoryMovements.inventoryItemId, input.inventoryItemId),
      input.movementType
        ? eq(
            inventoryMovements.movementType,
            input.movementType as (typeof inventoryMovements.movementType.enumValues)[number],
          )
        : undefined,
    );
    const [rows, totals] = await Promise.all([
      this.database.db
        .select({
          movement: inventoryMovements,
          actorName: users.name,
        })
        .from(inventoryMovements)
        .leftJoin(users, eq(users.id, inventoryMovements.actorUserId))
        .where(where)
        .orderBy(desc(inventoryMovements.createdAt))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      this.database.db
        .select({ total: count() })
        .from(inventoryMovements)
        .where(where),
    ]);
    return {
      items: rows.map(({ movement, actorName }): InventoryMovementEntity => ({
        ...movement,
        actorName,
      })),
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async adjust(input: Parameters<InventoryRepository["adjust"]>[0]) {
    return this.database.db.transaction(async (tx) => {
      const [current] = await tx
        .select(itemSelection)
        .from(inventoryItems)
        .innerJoin(products, eq(products.id, inventoryItems.productId))
        .innerJoin(
          productVariants,
          eq(productVariants.id, inventoryItems.variantId),
        )
        .where(
          and(
            eq(inventoryItems.storeId, input.storeId),
            eq(inventoryItems.id, input.inventoryItemId),
          ),
        )
        .limit(1)
        .for("update");
      if (!current) return { status: "not_found" as const };
      if (!this.availableForWrites(current))
        return { status: "unavailable" as const };
      if (input.idempotencyKey) {
        const [existing] = await tx
          .select({ id: inventoryMovements.id })
          .from(inventoryMovements)
          .where(
            and(
              eq(inventoryMovements.storeId, input.storeId),
              eq(inventoryMovements.idempotencyKey, input.idempotencyKey),
            ),
          )
          .limit(1);
        if (existing) return { status: "idempotent" as const, item: current };
      }
      const nextStock =
        input.operation === "set"
          ? input.quantity
          : current.stockQuantity +
            (input.operation === "increase" ? input.quantity : -input.quantity);
      if (nextStock < current.reservedQuantity || nextStock < 0)
        return { status: "insufficient_stock" as const };
      const [updated] = await tx
        .update(inventoryItems)
        .set({ stockQuantity: nextStock, updatedAt: new Date() })
        .where(
          and(
            eq(inventoryItems.id, current.id),
            eq(inventoryItems.storeId, input.storeId),
            eq(inventoryItems.stockQuantity, current.stockQuantity),
            eq(inventoryItems.reservedQuantity, current.reservedQuantity),
          ),
        )
        .returning({ updatedAt: inventoryItems.updatedAt });
      if (!updated) return { status: "conflict" as const };
      await tx.insert(inventoryMovements).values({
        storeId: input.storeId,
        productId: current.productId,
        variantId: current.variantId,
        inventoryItemId: current.id,
        movementType:
          input.operation === "set"
            ? "set_quantity"
            : input.operation === "increase"
              ? "manual_increase"
              : "manual_decrease",
        quantityDelta: nextStock - current.stockQuantity,
        stockBefore: current.stockQuantity,
        stockAfter: nextStock,
        reservedBefore: current.reservedQuantity,
        reservedAfter: current.reservedQuantity,
        reason: input.reason,
        actorUserId: input.actorUserId,
        idempotencyKey: input.idempotencyKey,
      });
      return {
        status: "success" as const,
        item: {
          ...current,
          stockQuantity: nextStock,
          updatedAt: updated.updatedAt,
        },
      };
    });
  }

  async updateThreshold(
    input: Parameters<InventoryRepository["updateThreshold"]>[0],
  ) {
    return this.database.db.transaction(async (tx) => {
      const [current] = await tx
        .select(itemSelection)
        .from(inventoryItems)
        .innerJoin(products, eq(products.id, inventoryItems.productId))
        .innerJoin(
          productVariants,
          eq(productVariants.id, inventoryItems.variantId),
        )
        .where(
          and(
            eq(inventoryItems.storeId, input.storeId),
            eq(inventoryItems.id, input.inventoryItemId),
          ),
        )
        .limit(1)
        .for("update");
      if (!current) return { status: "not_found" as const };
      if (!this.availableForWrites(current))
        return { status: "unavailable" as const };
      if (input.idempotencyKey) {
        const [existing] = await tx
          .select({ id: inventoryMovements.id })
          .from(inventoryMovements)
          .where(
            and(
              eq(inventoryMovements.storeId, input.storeId),
              eq(inventoryMovements.idempotencyKey, input.idempotencyKey),
            ),
          )
          .limit(1);
        if (existing) return { status: "idempotent" as const, item: current };
      }
      const [updated] = await tx
        .update(inventoryItems)
        .set({
          lowStockThreshold: input.lowStockThreshold,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryItems.id, current.id),
            eq(inventoryItems.storeId, input.storeId),
          ),
        )
        .returning({ updatedAt: inventoryItems.updatedAt });
      if (!updated) return { status: "conflict" as const };
      await tx.insert(inventoryMovements).values({
        storeId: input.storeId,
        productId: current.productId,
        variantId: current.variantId,
        inventoryItemId: current.id,
        movementType: "correction",
        quantityDelta: 0,
        stockBefore: current.stockQuantity,
        stockAfter: current.stockQuantity,
        reservedBefore: current.reservedQuantity,
        reservedAfter: current.reservedQuantity,
        reason: input.reason,
        actorUserId: input.actorUserId,
        idempotencyKey: input.idempotencyKey,
        metadata: {
          previousLowStockThreshold: current.lowStockThreshold,
          newLowStockThreshold: input.lowStockThreshold,
        },
      });
      return {
        status: "success" as const,
        item: {
          ...current,
          lowStockThreshold: input.lowStockThreshold,
          updatedAt: updated.updatedAt,
        },
      };
    });
  }

  async reserve(input: Parameters<InventoryRepository["reserve"]>[0]) {
    return this.database.db.transaction(async (tx) => {
      const [current] = await tx
        .select(itemSelection)
        .from(inventoryItems)
        .innerJoin(products, eq(products.id, inventoryItems.productId))
        .innerJoin(
          productVariants,
          eq(productVariants.id, inventoryItems.variantId),
        )
        .where(
          and(
            eq(inventoryItems.storeId, input.storeId),
            eq(inventoryItems.id, input.inventoryItemId),
          ),
        )
        .limit(1)
        .for("update");
      if (!current) return { status: "not_found" as const };
      if (!this.availableForWrites(current))
        return { status: "unavailable" as const };
      const [existing] = await tx
        .select()
        .from(inventoryReservations)
        .where(
          and(
            eq(inventoryReservations.storeId, input.storeId),
            eq(inventoryReservations.idempotencyKey, input.idempotencyKey),
          ),
        )
        .limit(1);
      if (existing)
        return {
          status: "idempotent" as const,
          item: current,
          reservation: existing,
        };
      if (current.stockQuantity - current.reservedQuantity < input.quantity)
        return { status: "insufficient_stock" as const };
      const nextReserved = current.reservedQuantity + input.quantity;
      const [updated] = await tx
        .update(inventoryItems)
        .set({ reservedQuantity: nextReserved, updatedAt: new Date() })
        .where(
          and(
            eq(inventoryItems.id, current.id),
            eq(inventoryItems.storeId, input.storeId),
            eq(inventoryItems.reservedQuantity, current.reservedQuantity),
            sql`${inventoryItems.stockQuantity} - ${inventoryItems.reservedQuantity} >= ${input.quantity}`,
          ),
        )
        .returning({ updatedAt: inventoryItems.updatedAt });
      if (!updated) return { status: "conflict" as const };
      const [reservation] = await tx
        .insert(inventoryReservations)
        .values({
          storeId: input.storeId,
          productId: current.productId,
          variantId: current.variantId,
          inventoryItemId: current.id,
          quantity: input.quantity,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          idempotencyKey: input.idempotencyKey,
          expiresAt: input.expiresAt,
        })
        .returning();
      if (!reservation) throw new Error("Failed to create reservation.");
      await tx.insert(inventoryMovements).values({
        storeId: input.storeId,
        productId: current.productId,
        variantId: current.variantId,
        inventoryItemId: current.id,
        movementType: "reservation",
        quantityDelta: 0,
        stockBefore: current.stockQuantity,
        stockAfter: current.stockQuantity,
        reservedBefore: current.reservedQuantity,
        reservedAfter: nextReserved,
        reason: "Inventory reserved",
        referenceType: "reservation",
        referenceId: reservation.id,
        actorUserId: input.actorUserId,
        idempotencyKey: `reservation:${input.idempotencyKey}`,
      });
      return {
        status: "success" as const,
        item: {
          ...current,
          reservedQuantity: nextReserved,
          updatedAt: updated.updatedAt,
        },
        reservation,
      };
    });
  }

  async transitionReservation(
    input: Parameters<InventoryRepository["transitionReservation"]>[0],
  ) {
    return this.database.db.transaction(async (tx) => {
      const [reservation] = await tx
        .select()
        .from(inventoryReservations)
        .where(
          and(
            eq(inventoryReservations.storeId, input.storeId),
            eq(inventoryReservations.id, input.reservationId),
          ),
        )
        .limit(1)
        .for("update");
      if (!reservation) return { status: "not_found" as const };
      if (reservation.status !== "active")
        return { status: "already_processed" as const };
      if (input.transition === "expire" && reservation.expiresAt > new Date())
        return { status: "not_expired" as const };
      const [current] = await tx
        .select(itemSelection)
        .from(inventoryItems)
        .innerJoin(products, eq(products.id, inventoryItems.productId))
        .innerJoin(
          productVariants,
          eq(productVariants.id, inventoryItems.variantId),
        )
        .where(
          and(
            eq(inventoryItems.storeId, input.storeId),
            eq(inventoryItems.id, reservation.inventoryItemId),
          ),
        )
        .limit(1)
        .for("update");
      if (!current) return { status: "not_found" as const };
      const nextReserved = current.reservedQuantity - reservation.quantity;
      const nextStock =
        input.transition === "convert"
          ? current.stockQuantity - reservation.quantity
          : current.stockQuantity;
      if (nextReserved < 0 || nextStock < nextReserved || nextStock < 0)
        return { status: "conflict" as const };
      const [updated] = await tx
        .update(inventoryItems)
        .set({
          stockQuantity: nextStock,
          reservedQuantity: nextReserved,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryItems.id, current.id),
            eq(inventoryItems.storeId, input.storeId),
            eq(inventoryItems.stockQuantity, current.stockQuantity),
            eq(inventoryItems.reservedQuantity, current.reservedQuantity),
          ),
        )
        .returning({ updatedAt: inventoryItems.updatedAt });
      if (!updated) return { status: "conflict" as const };
      const status =
        input.transition === "convert"
          ? "converted"
          : input.transition === "expire"
            ? "expired"
            : input.transition === "cancel"
              ? "cancelled"
              : "released";
      const releasedAt = new Date();
      const [transitioned] = await tx
        .update(inventoryReservations)
        .set({ status, releasedAt, updatedAt: releasedAt })
        .where(
          and(
            eq(inventoryReservations.id, reservation.id),
            eq(inventoryReservations.status, "active"),
          ),
        )
        .returning();
      if (!transitioned) return { status: "conflict" as const };
      const movementType =
        input.transition === "convert"
          ? "sale"
          : input.transition === "expire"
            ? "reservation_expiry"
            : "reservation_release";
      await tx.insert(inventoryMovements).values({
        storeId: input.storeId,
        productId: current.productId,
        variantId: current.variantId,
        inventoryItemId: current.id,
        movementType,
        quantityDelta: nextStock - current.stockQuantity,
        stockBefore: current.stockQuantity,
        stockAfter: nextStock,
        reservedBefore: current.reservedQuantity,
        reservedAfter: nextReserved,
        reason: input.reason,
        referenceType: "reservation",
        referenceId: reservation.id,
        actorUserId: input.actorUserId,
        idempotencyKey: `${input.transition}:${reservation.id}`,
        metadata: { transition: input.transition },
      });
      return {
        status: "success" as const,
        item: {
          ...current,
          stockQuantity: nextStock,
          reservedQuantity: nextReserved,
          updatedAt: updated.updatedAt,
        },
        reservation: transitioned,
      };
    });
  }

  private availableForWrites(item: InventoryItemEntity) {
    return (
      item.productArchivedAt === null &&
      item.variantArchivedAt === null &&
      item.variantIsActive
    );
  }
}
