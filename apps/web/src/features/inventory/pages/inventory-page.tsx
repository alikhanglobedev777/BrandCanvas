"use client";

import {
  getInventoryManagementListQueryKey,
  type InventoryAdjustmentRequestDto,
  type InventoryItemResponseDto,
  type InventoryManagementListStockStatus,
  useInventoryManagementAdjust,
  useInventoryManagementList,
} from "@brandcanvas/contracts";
import { LoadingState, PageHeader, SearchField } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import { useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { SellerGuard } from "@/features/authentication";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { InventoryAdjustmentDialog } from "../ui/inventory-adjustment-dialog";
import { InventoryTable } from "../ui/inventory-table";

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [stockStatus, setStockStatus] = useState<
    InventoryManagementListStockStatus | "all"
  >("all");
  const [selected, setSelected] = useState<InventoryItemResponseDto | null>(
    null,
  );
  const inventory = useInventoryManagementList({
    page,
    pageSize: 10,
    ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
    ...(stockStatus !== "all" ? { stockStatus } : {}),
  });
  const adjust = useInventoryManagementAdjust({
    mutation: {
      onSuccess: async () => {
        setSelected(null);
        await queryClient.invalidateQueries({
          queryKey: getInventoryManagementListQueryKey(),
        });
      },
    },
  });
  const submit = (data: InventoryAdjustmentRequestDto) => {
    if (selected) adjust.mutate({ inventoryItemId: selected.id, data });
  };

  return (
    <SellerGuard>
      <PageHeader
        eyebrow="Seller inventory"
        title="Inventory"
        description="Search every product variant, inspect available stock, and make audited adjustments."
      />
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <SearchField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search product, variant, or SKU"
            sx={{ flex: 1 }}
          />
          <FormControl sx={{ minWidth: 190 }}>
            <InputLabel>Stock status</InputLabel>
            <Select
              label="Stock status"
              value={stockStatus}
              onChange={(event) => {
                setStockStatus(
                  event.target.value as
                    InventoryManagementListStockStatus | "all",
                );
                setPage(1);
              }}
            >
              <MenuItem value="all">All inventory</MenuItem>
              <MenuItem value="in_stock">In stock</MenuItem>
              <MenuItem value="low_stock">Low stock</MenuItem>
              <MenuItem value="out_of_stock">Out of stock</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>
      {inventory.isPending ? <LoadingState label="Loading inventory…" /> : null}
      {inventory.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(inventory.error, "Unable to load inventory.")}
        </Alert>
      ) : null}
      {inventory.data ? (
        <Stack spacing={3}>
          <InventoryTable items={inventory.data.items} onAdjust={setSelected} />
          {inventory.data.totalPages > 1 ? (
            <Pagination
              page={page}
              count={inventory.data.totalPages}
              onChange={(_, value) => setPage(value)}
            />
          ) : null}
        </Stack>
      ) : null}
      <InventoryAdjustmentDialog
        item={selected}
        loading={adjust.isPending}
        error={adjust.error}
        onClose={() => {
          adjust.reset();
          setSelected(null);
        }}
        onSubmit={submit}
      />
    </SellerGuard>
  );
}
