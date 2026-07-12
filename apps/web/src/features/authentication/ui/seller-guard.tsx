"use client";

import { useAuthMe } from "@brandcanvas/contracts";
import { EmptyState, LoadingState } from "@brandcanvas/ui";
import type { ReactNode } from "react";

export function SellerGuard({ children }: { children: ReactNode }) {
  const account = useAuthMe({ query: { retry: false } });

  if (account.isPending) return <LoadingState label="Checking seller access…" />;
  if (!account.data || account.data.platformRole !== "user" || !account.data.storeId) {
    return (
      <EmptyState
        title="Seller access required"
        description="This section is available only to an active seller account assigned to a BrandCanvas store."
      />
    );
  }

  return children;
}
