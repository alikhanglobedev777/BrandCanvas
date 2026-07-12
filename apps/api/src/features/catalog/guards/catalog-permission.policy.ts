export type CatalogPermission = "catalog" | "inventory";
export type CatalogMemberRole =
  | "owner"
  | "admin"
  | "catalog_manager"
  | "inventory_manager"
  | "order_manager"
  | "support_agent";
export type CatalogStoreStatus =
  "pending" | "active" | "inactive" | "suspended" | "archived";

export function hasCatalogPermission(
  role: CatalogMemberRole,
  status: CatalogStoreStatus,
  permission: CatalogPermission,
): boolean {
  if (status !== "active") return false;
  return permission === "inventory"
    ? ["owner", "admin", "catalog_manager", "inventory_manager"].includes(role)
    : ["owner", "admin", "catalog_manager"].includes(role);
}
