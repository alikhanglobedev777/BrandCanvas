import type { ProductStatusValue, StockStatusValue } from "../dto";

export interface ProductEntity {
  id: string;
  variantId: string;
  inventoryItemId: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProductStatusValue;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  stockStatus: StockStatusValue;
  createdAt: Date;
  updatedAt: Date;
}
