import type { AuthUserDtoPlatformRole } from "@brandcanvas/contracts";
import type { DashboardNavigationItem } from "@brandcanvas/ui";

const superAdminNavigation: DashboardNavigationItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Stores", href: "/admin/stores" },
  { label: "Plans", href: "/admin/platform/plans" },
  { label: "Platform analytics", href: "/admin/platform/analytics" },
];

const sellerNavigation: DashboardNavigationItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Products", href: "/admin/products" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Collections", href: "/admin/collections" },
  { label: "Inventory", href: "/admin/inventory" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Discounts", href: "/admin/discounts" },
  { label: "Shipping", href: "/admin/shipping" },
  { label: "Messages", href: "/admin/messages" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Billing", href: "/admin/billing" },
  { label: "Store settings", href: "/admin/store/settings" },
  { label: "Brand assets", href: "/admin/store/branding" },
  { label: "Theme editor", href: "/admin/store/theme" },
];

export function getDashboardNavigation(
  role: AuthUserDtoPlatformRole,
): DashboardNavigationItem[] {
  return role === "super_admin" ? superAdminNavigation : sellerNavigation;
}
