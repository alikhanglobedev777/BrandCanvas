import type { ProductImageEntity } from "../entities";

export interface CreateProductImageInput {
  storeId: string;
  productId: string;
  variantId: string | null;
  storageProvider: string;
  storageKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  altText: string | null;
}

export abstract class ProductImageRepository {
  abstract productExists(storeId: string, productId: string): Promise<boolean>;
  abstract variantExists(
    storeId: string,
    productId: string,
    variantId: string,
  ): Promise<boolean>;
  abstract list(
    storeId: string,
    productId: string,
  ): Promise<ProductImageEntity[]>;
  abstract find(
    storeId: string,
    productId: string,
    imageId: string,
  ): Promise<ProductImageEntity | null>;
  abstract create(input: CreateProductImageInput): Promise<ProductImageEntity>;
  abstract update(
    storeId: string,
    productId: string,
    imageId: string,
    input: { altText?: string | null; variantId?: string | null },
  ): Promise<ProductImageEntity | null>;
  abstract reorder(
    storeId: string,
    productId: string,
    imageIds: string[],
  ): Promise<ProductImageEntity[] | "invalid_order" | null>;
  abstract setPrimary(
    storeId: string,
    productId: string,
    imageId: string,
  ): Promise<ProductImageEntity[] | null>;
  abstract delete(
    storeId: string,
    productId: string,
    imageId: string,
  ): Promise<ProductImageEntity | null>;
}
