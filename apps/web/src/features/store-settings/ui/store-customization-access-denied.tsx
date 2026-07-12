"use client";

import { EmptyState } from "@brandcanvas/ui";

export function StoreCustomizationAccessDenied() {
  return (
    <EmptyState
      title="Customization access required"
      description="Only store owners and administrators can manage store settings and branding. If you need access, ask a store owner or BrandCanvas super admin."
    />
  );
}
