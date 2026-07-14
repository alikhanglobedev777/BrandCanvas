import type {
  InventoryItemEntity,
  InventoryMovementEntity,
  InventoryReservationEntity,
} from "../entities";
import type { InventoryAdjustmentOperationValue } from "../dto";

export interface InventoryPageInput {
  storeId: string;
  page: number;
  pageSize: number;
  search?: string;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  productId?: string;
}

export type InventoryMutationResult =
  | { status: "success" | "idempotent"; item: InventoryItemEntity }
  | {
      status: "not_found" | "unavailable" | "insufficient_stock" | "conflict";
    };

export type ReservationMutationResult =
  | {
      status: "success" | "idempotent";
      item: InventoryItemEntity;
      reservation: InventoryReservationEntity;
    }
  | {
      status:
        | "not_found"
        | "unavailable"
        | "insufficient_stock"
        | "already_processed"
        | "not_expired"
        | "conflict";
    };

export abstract class InventoryRepository {
  abstract list(input: InventoryPageInput): Promise<{
    items: InventoryItemEntity[];
    total: number;
  }>;
  abstract listProduct(
    storeId: string,
    productId: string,
  ): Promise<InventoryItemEntity[] | null>;
  abstract listMovements(input: {
    storeId: string;
    inventoryItemId: string;
    page: number;
    pageSize: number;
    movementType?: string;
  }): Promise<{ items: InventoryMovementEntity[]; total: number } | null>;
  abstract adjust(input: {
    storeId: string;
    inventoryItemId: string;
    operation: InventoryAdjustmentOperationValue;
    quantity: number;
    reason: string;
    actorUserId: string;
    idempotencyKey?: string;
  }): Promise<InventoryMutationResult>;
  abstract updateThreshold(input: {
    storeId: string;
    inventoryItemId: string;
    lowStockThreshold: number;
    reason: string;
    actorUserId: string;
    idempotencyKey?: string;
  }): Promise<InventoryMutationResult>;
  abstract reserve(input: {
    storeId: string;
    inventoryItemId: string;
    quantity: number;
    referenceType: string;
    referenceId: string;
    idempotencyKey: string;
    expiresAt: Date;
    actorUserId: string;
  }): Promise<ReservationMutationResult>;
  abstract transitionReservation(input: {
    storeId: string;
    reservationId: string;
    transition: "release" | "expire" | "cancel" | "convert";
    actorUserId: string;
    reason: string;
  }): Promise<ReservationMutationResult>;
}
