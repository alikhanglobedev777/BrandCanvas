import type { ProductResponseDto, StockStatusValue } from "../dto";
import type { ProductEntity } from "../entities";

export class ProductMapper {
  static toResponse(entity: ProductEntity): ProductResponseDto {
    const availableQuantity = Math.max(
      0,
      entity.stockQuantity - entity.reservedQuantity,
    );
    return {
      id: entity.id,
      variantId: entity.variantId,
      inventoryItemId: entity.inventoryItemId,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      status: entity.status,
      sku: entity.sku,
      price: entity.price,
      compareAtPrice: entity.compareAtPrice,
      stockQuantity: entity.stockQuantity,
      reservedQuantity: entity.reservedQuantity,
      availableQuantity,
      lowStockThreshold: entity.lowStockThreshold,
      stockStatus: this.getStockStatus(
        availableQuantity,
        entity.lowStockThreshold,
      ),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static getStockStatus(
    availableQuantity: number,
    lowStockThreshold: number,
  ): StockStatusValue {
    if (availableQuantity <= 0) return "out_of_stock";
    if (availableQuantity <= lowStockThreshold) return "low_stock";
    return "in_stock";
  }
}
