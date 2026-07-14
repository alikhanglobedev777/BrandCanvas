import type { ProductImageResponseDto } from "../dto";
import type { ProductImageEntity } from "../entities";

export class ProductImageMapper {
  static toResponse(entity: ProductImageEntity): ProductImageResponseDto {
    return {
      id: entity.id,
      productId: entity.productId,
      variantId: entity.variantId,
      publicUrl: entity.publicUrl,
      originalFilename: entity.originalFilename,
      mimeType: entity.mimeType,
      sizeBytes: entity.sizeBytes,
      width: entity.width,
      height: entity.height,
      altText: entity.altText,
      position: entity.position,
      isPrimary: entity.isPrimary,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
