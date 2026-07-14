import type {
  InventoryMovementTypeValue,
  InventoryReservationStatusValue,
} from "../dto";

export interface InventoryItemEntity {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  productArchivedAt: Date | null;
  variantId: string;
  variantTitle: string;
  variantArchivedAt: Date | null;
  variantIsActive: boolean;
  sku: string;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovementEntity {
  id: string;
  storeId: string;
  productId: string;
  variantId: string | null;
  inventoryItemId: string;
  movementType: InventoryMovementTypeValue;
  quantityDelta: number;
  stockBefore: number;
  stockAfter: number;
  reservedBefore: number;
  reservedAfter: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  actorUserId: string | null;
  actorName: string | null;
  idempotencyKey: string | null;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: Date;
}

export interface InventoryReservationEntity {
  id: string;
  storeId: string;
  productId: string;
  variantId: string | null;
  inventoryItemId: string;
  quantity: number;
  status: InventoryReservationStatusValue;
  referenceType: string;
  referenceId: string;
  idempotencyKey: string;
  expiresAt: Date;
  releasedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
