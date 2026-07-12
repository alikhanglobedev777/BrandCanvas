import type { AuthUserDtoPlatformRole } from "@brandcanvas/contracts";
import type { DashboardNavigationItem } from "@brandcanvas/ui";

const superAdminNavigation: DashboardNavigationItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Stores", href: "/admin/stores" },
];

const sellerNavigation: DashboardNavigationItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Collections", href: "/admin/collections" },
  { label: "Inventory", href: "/admin/inventory" },
  { label: "Store settings", href: "/admin/store/settings" },
  { label: "Brand assets", href: "/admin/store/branding" },
  { label: "Theme editor", href: "/admin/store/theme" },
];

export function getDashboardNavigation(
  role: AuthUserDtoPlatformRole,
): DashboardNavigationItem[] {
  return role === "super_admin" ? superAdminNavigation : sellerNavigation;
}
