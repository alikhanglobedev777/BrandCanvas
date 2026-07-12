import type { StoreResponseDtoStatus } from "@brandcanvas/contracts";
import type { StatusTone } from "@brandcanvas/ui";

export function getStoreStatusTone(status: StoreResponseDtoStatus): StatusTone {
  switch (status) {
    case "active":
      return "success";
    case "pending":
      return "warning";
    case "inactive":
      return "default";
    case "suspended":
    case "archived":
      return "error";
    default:
      return "default";
  }
}

export function formatStoreStatus(status: StoreResponseDtoStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
