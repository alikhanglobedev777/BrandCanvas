"use client";

import { useAuthMe } from "@brandcanvas/contracts";
import { EmptyState, LoadingState } from "@brandcanvas/ui";
import type { ReactNode } from "react";

export function SuperAdminGuard({ children }: { children: ReactNode }) {
  const account = useAuthMe({ query: { retry: false } });

  if (account.isPending) return <LoadingState label="Checking permissions…" />;
  if (!account.data || account.data.platformRole !== "super_admin") {
    return (
      <EmptyState
        title="Access denied"
        description="Only BrandCanvas super administrators can access this section."
      />
    );
  }

  return children;
}
