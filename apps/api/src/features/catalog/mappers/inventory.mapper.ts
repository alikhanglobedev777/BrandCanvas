import type {
  InventoryItemResponseDto,
  InventoryMovementResponseDto,
  InventoryReservationResponseDto,
} from "../dto";
import type {
  InventoryItemEntity,
  InventoryMovementEntity,
  InventoryReservationEntity,
} from "../entities";
import { ProductMapper } from "./product.mapper";

export class InventoryMapper {
  static item(entity: InventoryItemEntity): InventoryItemResponseDto {
    const availableQuantity = entity.stockQuantity - entity.reservedQuantity;
    return {
      id: entity.id,
      productId: entity.productId,
      productName: entity.productName,
      variantId: entity.variantId,
      variantTitle: entity.variantTitle,
      sku: entity.sku,
      stockQuantity: entity.stockQuantity,
      reservedQuantity: entity.reservedQuantity,
      availableQuantity,
      lowStockThreshold: entity.lowStockThreshold,
      stockStatus: ProductMapper.getStockStatus(
        availableQuantity,
        entity.lowStockThreshold,
      ),
      isAvailable:
        entity.productArchivedAt === null &&
        entity.variantArchivedAt === null &&
        entity.variantIsActive,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static movement(
    entity: InventoryMovementEntity,
  ): InventoryMovementResponseDto {
    return {
      id: entity.id,
      movementType: entity.movementType,
      quantityDelta: entity.quantityDelta,
      stockBefore: entity.stockBefore,
      stockAfter: entity.stockAfter,
      reservedBefore: entity.reservedBefore,
      reservedAfter: entity.reservedAfter,
      reason: entity.reason,
      referenceType: entity.referenceType,
      referenceId: entity.referenceId,
      actorName: entity.actorName,
      metadata: entity.metadata,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  static reservation(
    entity: InventoryReservationEntity,
  ): InventoryReservationResponseDto {
    return {
      id: entity.id,
      inventoryItemId: entity.inventoryItemId,
      quantity: entity.quantity,
      status: entity.status,
      referenceType: entity.referenceType,
      referenceId: entity.referenceId,
      expiresAt: entity.expiresAt.toISOString(),
      releasedAt: entity.releasedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
