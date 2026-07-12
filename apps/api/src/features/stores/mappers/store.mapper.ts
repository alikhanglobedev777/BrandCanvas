import type { StoreEntity } from "../entities";
import { StoreResponseDto } from "../dto";

export class StoreMapper {
  static toResponse(entity: StoreEntity): StoreResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      subdomain: entity.subdomain,
      customDomain: entity.customDomain,
      logoUrl: entity.logoUrl,
      status: entity.status,
      deactivationReason: entity.deactivationReason,
      owner: entity.owner,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
