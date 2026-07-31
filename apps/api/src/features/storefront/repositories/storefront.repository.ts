import type {
  PublicCategoryDto,
  PublicCollectionDto,
  PublicProductDetailsDto,
  PublicProductListDto,
  PublicProductQueryDto,
  PublicStorefrontDto,
} from "../dto";

export abstract class StorefrontRepository {
  abstract resolve(input: { hostname?: string; storeSlug?: string; platformDomain: string }): Promise<PublicStorefrontDto | null>;
  abstract listCategories(storeId: string): Promise<PublicCategoryDto[]>;
  abstract listCollections(storeId: string): Promise<PublicCollectionDto[]>;
  abstract listProducts(storeId: string, query: PublicProductQueryDto): Promise<PublicProductListDto>;
  abstract getProduct(storeId: string, slug: string): Promise<PublicProductDetailsDto | null>;
}
