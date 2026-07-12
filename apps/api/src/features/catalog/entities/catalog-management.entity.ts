import type {
  CategoryStatusValue,
  CollectionStatusValue,
  ProductStatusValue,
} from "../dto";

export interface CategoryEntity {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  imageAssetId: string | null;
  sortOrder: number;
  status: CategoryStatusValue;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionProductEntity {
  productId: string;
  name: string;
  sortOrder: number;
}

export interface CollectionEntity {
  id: string;
  storeId: string;
  title: string;
  slug: string;
  description: string | null;
  status: CollectionStatusValue;
  sortOrder: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  products: CollectionProductEntity[];
}

export interface ProductOptionValueEntity {
  id: string;
  value: string;
  position: number;
}

export interface ProductOptionEntity {
  id: string;
  name: string;
  position: number;
  values: ProductOptionValueEntity[];
}

export interface ProductVariantEntity {
  id: string;
  title: string;
  sku: string;
  barcode: string | null;
  priceOverrideMinor: number | null;
  compareAtPriceMinor: number | null;
  costPriceMinor: number | null;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isDefault: boolean;
  archivedAt: Date | null;
  optionValueIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDetailsEntity {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string | null;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  costPriceMinor: number | null;
  barcode: string | null;
  keywords: string[];
  status: ProductStatusValue;
  archivedAt: Date | null;
  collectionIds: string[];
  options: ProductOptionEntity[];
  variants: ProductVariantEntity[];
  createdAt: Date;
  updatedAt: Date;
}
