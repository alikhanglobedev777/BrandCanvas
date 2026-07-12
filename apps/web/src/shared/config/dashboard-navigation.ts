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
  { label: "Store settings", href: "/admin/store/settings" },
  { label: "Branding", href: "/admin/store/branding" },
];

export function getDashboardNavigation(
  role: AuthUserDtoPlatformRole,
): DashboardNavigationItem[] {
  return role === "super_admin" ? superAdminNavigation : sellerNavigation;
}
