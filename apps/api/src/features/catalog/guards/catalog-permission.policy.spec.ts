import { describe, expect, it } from "vitest";
import { hasCatalogPermission } from "./catalog-permission.policy";
describe("hasCatalogPermission", () => {
  it("denies inactive and suspended stores regardless of seller role", () => {
    expect(hasCatalogPermission("owner", "inactive", "catalog")).toBe(false);
    expect(hasCatalogPermission("admin", "suspended", "catalog")).toBe(false);
  });
  it("allows catalog managers and restricts inventory-only members", () => {
    expect(hasCatalogPermission("catalog_manager", "active", "catalog")).toBe(
      true,
    );
    expect(hasCatalogPermission("inventory_manager", "active", "catalog")).toBe(
      false,
    );
    expect(
      hasCatalogPermission("inventory_manager", "active", "inventory"),
    ).toBe(true);
  });
});
