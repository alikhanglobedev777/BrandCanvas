import type { InventoryAdjustmentTypeValue, ProductStatusValue, StockStatusValue } from "../dto";
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
  price: string;
  compareAtPrice?: string;
  initialStock: number;
  lowStockThreshold: number;
}

export type InventoryAdjustmentResult =
  | { status: "success"; product: ProductEntity }
  | { status: "not_found" }
  | { status: "insufficient_stock" };

export abstract class CatalogRepository {
  abstract findMany(input: ProductListInput): Promise<ProductListResult>;
  abstract create(input: CreateProductPersistenceInput): Promise<ProductEntity>;
  abstract adjustInventory(input: {
    storeId: string;
    inventoryItemId: string;
    type: InventoryAdjustmentTypeValue;
    quantity: number;
    reason: string;
    createdBy: string;
  }): Promise<InventoryAdjustmentResult>;
}
