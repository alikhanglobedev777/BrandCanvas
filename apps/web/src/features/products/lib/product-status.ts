import type { ProductResponseDtoStatus, ProductResponseDtoStockStatus } from "@brandcanvas/contracts";
import type { StatusTone } from "@brandcanvas/ui";

export function formatProductStatus(value: ProductResponseDtoStatus | ProductResponseDtoStockStatus): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getProductStatusTone(status: ProductResponseDtoStatus): StatusTone {
  switch (status) {
    case "active":
      return "success";
    case "draft":
      return "warning";
    case "inactive":
      return "default";
    case "archived":
      return "error";
    default:
      return "default";
  }
}

export function getStockStatusTone(status: ProductResponseDtoStockStatus): StatusTone {
  switch (status) {
    case "in_stock":
      return "success";
    case "low_stock":
      return "warning";
    case "out_of_stock":
      return "error";
    default:
      return "default";
  }
}
