import type {
  CategoryResponseDto,
  CollectionResponseDto,
  ProductDetailsResponseDto,
} from "../dto";
import type {
  CategoryEntity,
  CollectionEntity,
  ProductDetailsEntity,
} from "../entities";
import { ProductMapper } from "./product.mapper";

export class CatalogManagementMapper {
  static category(entity: CategoryEntity): CategoryResponseDto {
    return {
      ...entity,
      archivedAt: entity.archivedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static collection(entity: CollectionEntity): CollectionResponseDto {
    return {
      ...entity,
      archivedAt: entity.archivedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static product(entity: ProductDetailsEntity): ProductDetailsResponseDto {
    return {
      ...entity,
      archivedAt: entity.archivedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      variants: entity.variants.map((variant) => {
        const availableQuantity = Math.max(
          0,
          variant.stockQuantity - variant.reservedQuantity,
        );
        return {
          ...variant,
          availableQuantity,
          stockStatus: ProductMapper.getStockStatus(
            availableQuantity,
            variant.lowStockThreshold,
          ),
          archivedAt: variant.archivedAt?.toISOString() ?? null,
          createdAt: variant.createdAt.toISOString(),
          updatedAt: variant.updatedAt.toISOString(),
        };
      }),
    };
  }
}
