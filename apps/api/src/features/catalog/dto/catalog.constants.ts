export const PRODUCT_STATUSES = [
  "draft",
  "active",
  "inactive",
  "archived",
] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

export const STOCK_STATUSES = [
  "in_stock",
  "low_stock",
  "out_of_stock",
] as const;
export type StockStatusValue = (typeof STOCK_STATUSES)[number];

export const INVENTORY_ADJUSTMENT_TYPES = [
  "manual_increase",
  "manual_decrease",
] as const;
export type InventoryAdjustmentTypeValue =
  (typeof INVENTORY_ADJUSTMENT_TYPES)[number];
