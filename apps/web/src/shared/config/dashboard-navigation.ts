import type { AuthUserDtoPlatformRole } from "@brandcanvas/contracts";
import type { DashboardNavigationItem } from "@brandcanvas/ui";

const superAdminNavigation: DashboardNavigationItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Stores", href: "/admin/stores" },
];

const sellerNavigation: DashboardNavigationItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Products", href: "/admin/products" },
  { label: "Inventory", href: "/admin/inventory" },
];

export function getDashboardNavigation(role: AuthUserDtoPlatformRole): DashboardNavigationItem[] {
  return role === "super_admin" ? superAdminNavigation : sellerNavigation;
}
