import type {
  CategoryStatusValue,
  CollectionStatusValue,
  ProductStatusValue,
} from "../dto";
import type {
  CategoryEntity,
  CollectionEntity,
  ProductDetailsEntity,
} from "../entities";

export interface PageInput {
  storeId: string;
  page: number;
  pageSize: number;
  search?: string;
  archived?: boolean;
}
export type CategoryWrite = {
  name?: string;
  slug?: string;
  description?: string | null;
  imageAssetId?: string | null;
  sortOrder?: number;
  status?: CategoryStatusValue;
};
export type CollectionWrite = {
  title?: string;
  slug?: string;
  description?: string | null;
  status?: CollectionStatusValue;
  sortOrder?: number;
};
export type ProductWrite = {
  name?: string;
  slug?: string;
  description?: string | null;
  categoryId?: string | null;
  priceMinor?: number;
  compareAtPriceMinor?: number | null;
  costPriceMinor?: number | null;
  barcode?: string | null;
  keywords?: string[];
  status?: ProductStatusValue;
  collectionIds?: string[];
};
export type VariantWrite = {
  title?: string;
  sku?: string;
  barcode?: string | null;
  priceOverrideMinor?: number | null;
  compareAtPriceMinor?: number | null;
  costPriceMinor?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number;
  optionValueIds?: string[];
  isActive?: boolean;
  createdBy?: string;
};

export abstract class CatalogManagementRepository {
  abstract storeAssetExists(storeId: string, assetId: string): Promise<boolean>;
  abstract listCategories(
    input: PageInput & { status?: CategoryStatusValue },
  ): Promise<{ items: CategoryEntity[]; total: number }>;
  abstract findCategory(
    storeId: string,
    categoryId: string,
  ): Promise<CategoryEntity | null>;
  abstract createCategory(
    storeId: string,
    input: Required<Pick<CategoryWrite, "name" | "slug">> & CategoryWrite,
  ): Promise<CategoryEntity>;
  abstract updateCategory(
    storeId: string,
    categoryId: string,
    input: CategoryWrite,
  ): Promise<CategoryEntity | null>;
  abstract setCategoryArchived(
    storeId: string,
    categoryId: string,
    archived: boolean,
  ): Promise<CategoryEntity | null>;
  abstract listCollections(
    input: PageInput & { status?: CollectionStatusValue },
  ): Promise<{ items: CollectionEntity[]; total: number }>;
  abstract findCollection(
    storeId: string,
    collectionId: string,
  ): Promise<CollectionEntity | null>;
  abstract createCollection(
    storeId: string,
    input: Required<Pick<CollectionWrite, "title" | "slug">> & CollectionWrite,
  ): Promise<CollectionEntity>;
  abstract updateCollection(
    storeId: string,
    collectionId: string,
    input: CollectionWrite,
  ): Promise<CollectionEntity | null>;
  abstract setCollectionArchived(
    storeId: string,
    collectionId: string,
    archived: boolean,
  ): Promise<CollectionEntity | null>;
  abstract addCollectionProducts(
    storeId: string,
    collectionId: string,
    productIds: string[],
  ): Promise<CollectionEntity | null | "invalid_products">;
  abstract removeCollectionProducts(
    storeId: string,
    collectionId: string,
    productIds: string[],
  ): Promise<CollectionEntity | null>;
  abstract reorderCollectionProducts(
    storeId: string,
    collectionId: string,
    productIds: string[],
  ): Promise<CollectionEntity | null | "invalid_order">;
  abstract findProductDetails(
    storeId: string,
    productId: string,
  ): Promise<ProductDetailsEntity | null>;
  abstract updateProduct(
    storeId: string,
    productId: string,
    input: ProductWrite,
  ): Promise<
    ProductDetailsEntity | null | "invalid_category" | "invalid_collections"
  >;
  abstract setProductArchived(
    storeId: string,
    productId: string,
    archived: boolean,
  ): Promise<ProductDetailsEntity | null>;
  abstract createOption(
    storeId: string,
    productId: string,
    input: { name: string; position: number },
  ): Promise<ProductDetailsEntity | null>;
  abstract updateOption(
    storeId: string,
    productId: string,
    optionId: string,
    input: { name?: string; position?: number },
  ): Promise<ProductDetailsEntity | null>;
  abstract deleteOption(
    storeId: string,
    productId: string,
    optionId: string,
  ): Promise<ProductDetailsEntity | null>;
  abstract createOptionValue(
    storeId: string,
    productId: string,
    optionId: string,
    input: { value: string; position: number },
  ): Promise<ProductDetailsEntity | null>;
  abstract updateOptionValue(
    storeId: string,
    productId: string,
    valueId: string,
    input: { value?: string; position?: number },
  ): Promise<ProductDetailsEntity | null>;
  abstract deleteOptionValue(
    storeId: string,
    productId: string,
    valueId: string,
  ): Promise<ProductDetailsEntity | null>;
  abstract createVariant(
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
  ): Promise<
    ProductDetailsEntity | null | "invalid_values" | "duplicate_combination"
  >;
  abstract updateVariant(
    storeId: string,
    productId: string,
    variantId: string,
    input: VariantWrite,
  ): Promise<
    | ProductDetailsEntity
    | null
    | "invalid_values"
    | "duplicate_combination"
    | "reserved_stock"
  >;
  abstract archiveVariant(
    storeId: string,
    productId: string,
    variantId: string,
  ): Promise<ProductDetailsEntity | null>;
}
