"use client";

import { useAuthMe, useStoreGetSummary } from "@brandcanvas/contracts";
import { LoadingState, PageHeader, SummaryCard } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

export function SuperAdminDashboardPage() {
  const account = useAuthMe({ query: { retry: false } });
  const summary = useStoreGetSummary({ query: { enabled: account.data?.platformRole === "super_admin" } });

  if (account.isPending) return <LoadingState label="Loading dashboard…" />;

  if (account.data?.platformRole !== "super_admin") {
    return (
      <>
        <PageHeader
          eyebrow="Seller"
          title={`Welcome, ${account.data?.name ?? "seller"}`}
          description="Your products, inventory, and storefront customization features are added in the next commerce patch."
          actions={<Chip label={account.data?.storeStatus ?? "No store"} color="primary" variant="outlined" />}
        />
        <Alert severity="info">Your seller account is connected to store ID: {account.data?.storeId ?? "Not assigned"}.</Alert>
      </>
    );
  }

  if (summary.isPending) return <LoadingState label="Loading platform statistics…" />;
  if (summary.isError || !summary.data) {
    return <Alert severity="error">{getApiErrorMessage(summary.error, "Unable to load platform statistics.")}</Alert>;
  }

  const cards = [
    { label: "Total stores", value: summary.data.total, shortLabel: "TS" },
    { label: "Active stores", value: summary.data.active, shortLabel: "AS" },
    { label: "Inactive stores", value: summary.data.inactive, shortLabel: "IS" },
    { label: "Suspended stores", value: summary.data.suspended, shortLabel: "SS" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Super admin"
        title="Platform dashboard"
        description="Live store counts from the BrandCanvas API."
        actions={<Chip label={`${summary.data.pending} pending`} color="warning" variant="outlined" />}
      />
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <SummaryCard {...card} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}
