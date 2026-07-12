"use client";

import {
  type CatalogFindManyStockStatus,
  getCatalogFindManyQueryKey,
  type InventoryAdjustmentDto,
  type ProductResponseDto,
  useCatalogAdjustInventory,
  useCatalogFindMany,
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
  const [stockStatus, setStockStatus] = useState<CatalogFindManyStockStatus | "all">("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductResponseDto | null>(null);

  const inventory = useCatalogFindMany({
    page,
    pageSize: 10,
    ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
    ...(stockStatus !== "all" ? { stockStatus } : {}),
  });

  const adjustInventory = useCatalogAdjustInventory({
    mutation: {
      onSuccess: async () => {
        setSelectedProduct(null);
        await queryClient.invalidateQueries({ queryKey: getCatalogFindManyQueryKey() });
      },
    },
  });

  const submitAdjustment = (data: InventoryAdjustmentDto) => {
    if (!selectedProduct) return;
    adjustInventory.mutate({ inventoryItemId: selectedProduct.inventoryItemId, data });
  };

  return (
    <SellerGuard>
      <PageHeader
        eyebrow="Seller inventory"
        title="Inventory"
        description="Stock status is calculated centrally. When available quantity reaches zero, the API reports the product as out of stock automatically."
      />
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <SearchField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search product or SKU"
            sx={{ flex: 1 }}
          />
          <FormControl sx={{ minWidth: 190 }}>
            <InputLabel>Stock status</InputLabel>
            <Select
              label="Stock status"
              value={stockStatus}
              onChange={(event) => {
                setStockStatus(event.target.value as CatalogFindManyStockStatus | "all");
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
      {inventory.isError ? <Alert severity="error">{getApiErrorMessage(inventory.error, "Unable to load inventory.")}</Alert> : null}
      {inventory.data ? (
        <Stack spacing={3}>
          <InventoryTable products={inventory.data.items} onAdjust={setSelectedProduct} />
          {inventory.data.totalPages > 1 ? (
            <Pagination page={page} count={inventory.data.totalPages} onChange={(_, value) => setPage(value)} />
          ) : null}
        </Stack>
      ) : null}

      <InventoryAdjustmentDialog
        product={selectedProduct}
        loading={adjustInventory.isPending}
        error={adjustInventory.error}
        onClose={() => {
          adjustInventory.reset();
          setSelectedProduct(null);
        }}
        onSubmit={submitAdjustment}
      />
    </SellerGuard>
  );
}
