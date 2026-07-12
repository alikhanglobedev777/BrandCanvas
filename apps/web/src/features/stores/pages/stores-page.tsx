"use client";

import {
  getStoreFindManyQueryKey,
  getStoreGetSummaryQueryKey,
  type CreateStoreResponseDto,
  type StoreFindManyStatus,
  type StoreResponseDto,
  type UpdateStoreStatusDto,
  useStoreCreate,
  useStoreFindMany,
  useStoreUpdateStatus,
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
import { SuperAdminGuard } from "@/features/authentication";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { CreateStoreDialog } from "../ui/create-store-dialog";
import { StoreCredentialsDialog } from "../ui/store-credentials-dialog";
import { StoreTable } from "../ui/store-table";
import { UpdateStoreStatusDialog } from "../ui/update-store-status-dialog";

export function StoresPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<StoreFindManyStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<CreateStoreResponseDto | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreResponseDto | null>(null);

  const stores = useStoreFindMany({
    page,
    pageSize: 10,
    ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
    ...(status !== "all" ? { status } : {}),
  });

  const invalidateStoreData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getStoreFindManyQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getStoreGetSummaryQueryKey() }),
    ]);
  };

  const createStore = useStoreCreate({
    mutation: {
      onSuccess: async (result) => {
        setCreateOpen(false);
        setCreated(result);
        setPage(1);
        await invalidateStoreData();
      },
    },
  });

  const updateStatus = useStoreUpdateStatus({
    mutation: {
      onSuccess: async () => {
        setSelectedStore(null);
        await invalidateStoreData();
      },
    },
  });

  const submitStatus = (data: UpdateStoreStatusDto) => {
    if (!selectedStore) return;
    updateStatus.mutate({ storeId: selectedStore.id, data });
  };

  return (
    <SuperAdminGuard>
      <PageHeader
        eyebrow="Super admin"
        title="Seller stores"
        description="Provision seller accounts, hand over temporary credentials, and control store access from one place."
        actions={<AppButton onClick={() => setCreateOpen(true)}>Create store</AppButton>}
      />

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <SearchField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search store, subdomain, or seller email"
            sx={{ flex: 1 }}
          />
          <FormControl sx={{ minWidth: 190 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StoreFindManyStatus | "all");
                setPage(1);
              }}
            >
              <MenuItem value="all">All statuses</MenuItem>
              {(["active", "pending", "inactive", "suspended", "archived"] satisfies StoreFindManyStatus[]).map((value) => (
                <MenuItem key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {stores.isPending ? <LoadingState label="Loading stores…" /> : null}
      {stores.isError ? <Alert severity="error">{getApiErrorMessage(stores.error, "Unable to load stores.")}</Alert> : null}
      {stores.data ? (
        <Stack spacing={3}>
          <StoreTable stores={stores.data.items} onManageStatus={setSelectedStore} />
          {stores.data.totalPages > 1 ? (
            <Pagination page={page} count={stores.data.totalPages} onChange={(_, value) => setPage(value)} />
          ) : null}
        </Stack>
      ) : null}

      <CreateStoreDialog
        open={createOpen}
        loading={createStore.isPending}
        error={createStore.error}
        onClose={() => {
          createStore.reset();
          setCreateOpen(false);
        }}
        onSubmit={(data) => createStore.mutate({ data })}
      />
      <StoreCredentialsDialog result={created} onClose={() => setCreated(null)} />
      <UpdateStoreStatusDialog
        store={selectedStore}
        loading={updateStatus.isPending}
        error={updateStatus.error}
        onClose={() => {
          updateStatus.reset();
          setSelectedStore(null);
        }}
        onSubmit={submitStatus}
      />
    </SuperAdminGuard>
  );
}
