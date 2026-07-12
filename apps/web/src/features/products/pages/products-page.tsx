"use client";

import {
  type CatalogFindManyStatus,
  getCatalogFindManyQueryKey,
  useCatalogCreate,
  useCatalogFindMany,
} from "@brandcanvas/contracts";
import { AppButton, LoadingState, PageHeader, SearchField } from "@brandcanvas/ui";
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
import { CreateProductDialog } from "../ui/create-product-dialog";
import { ProductTable } from "../ui/product-table";

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<CatalogFindManyStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const products = useCatalogFindMany({
    page,
    pageSize: 10,
    ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
    ...(status !== "all" ? { status } : {}),
  });

  const createProduct = useCatalogCreate({
    mutation: {
      onSuccess: async () => {
        setCreateOpen(false);
        setPage(1);
        await queryClient.invalidateQueries({ queryKey: getCatalogFindManyQueryKey() });
      },
    },
  });

  return (
    <SellerGuard>
      <PageHeader
        eyebrow="Seller catalog"
        title="Products"
        description="Create products with generated API contracts and keep their default variant inventory connected automatically."
        actions={<AppButton onClick={() => setCreateOpen(true)}>Add product</AppButton>}
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
            <InputLabel>Product status</InputLabel>
            <Select
              label="Product status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as CatalogFindManyStatus | "all");
                setPage(1);
              }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              {(["draft", "active", "inactive", "archived"] satisfies CatalogFindManyStatus[]).map((value) => (
                <MenuItem key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {products.isPending ? <LoadingState label="Loading products…" /> : null}
      {products.isError ? <Alert severity="error">{getApiErrorMessage(products.error, "Unable to load products.")}</Alert> : null}
      {products.data ? (
        <Stack spacing={3}>
          <ProductTable products={products.data.items} />
          {products.data.totalPages > 1 ? (
            <Pagination page={page} count={products.data.totalPages} onChange={(_, value) => setPage(value)} />
          ) : null}
        </Stack>
      ) : null}

      <CreateProductDialog
        open={createOpen}
        loading={createProduct.isPending}
        error={createProduct.error}
        onClose={() => {
          createProduct.reset();
          setCreateOpen(false);
        }}
        onSubmit={(data) => {
          const { compareAtPrice, ...requiredData } = data;
          createProduct.mutate({ data: compareAtPrice ? { ...requiredData, compareAtPrice } : requiredData });
        }}
      />
    </SellerGuard>
  );
}
