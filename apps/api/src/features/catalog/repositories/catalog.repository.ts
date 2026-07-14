import type { ProductStatusValue, StockStatusValue } from "../dto";
import type { ProductEntity } from "../entities";

export interface ProductListInput {
  storeId: string;
  page: number;
  pageSize: number;
  search?: string;
  status?: ProductStatusValue;
  stockStatus?: StockStatusValue;
}

export interface ProductListResult {
  items: ProductEntity[];
  total: number;
}

export interface CreateProductPersistenceInput {
  storeId: string;
  createdBy: string;
  name: string;
  slug: string;
  description?: string;
  status: ProductStatusValue;
  sku: string;
  priceMinor: number;
  compareAtPriceMinor?: number | null;
  initialStock: number;
  lowStockThreshold: number;
}

export abstract class CatalogRepository {
  abstract findMany(input: ProductListInput): Promise<ProductListResult>;
  abstract create(input: CreateProductPersistenceInput): Promise<ProductEntity>;
}
