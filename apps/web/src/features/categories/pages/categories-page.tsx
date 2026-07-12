"use client";
import {
  type CategoryResponseDto,
  type CatalogManagementListCategoriesStatus,
  getCatalogManagementListCategoriesQueryKey,
  useCatalogManagementArchiveCategory,
  useCatalogManagementCreateCategory,
  useCatalogManagementListCategories,
  useCatalogManagementRestoreCategory,
  useCatalogManagementUpdateCategory,
} from "@brandcanvas/contracts";
import {
  AppButton,
  EmptyState,
  LoadingState,
  PageHeader,
  SearchField,
} from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import { useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { SellerGuard } from "@/features/authentication";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { CategoryDialog } from "../ui/category-dialog";

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<
    CatalogManagementListCategoriesStatus | "all"
  >("all");
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<CategoryResponseDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const params = {
    page,
    pageSize: 10,
    archived,
    ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
    ...(status !== "all" ? { status } : {}),
  };
  const categories = useCatalogManagementListCategories(params);
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: getCatalogManagementListCategoriesQueryKey(),
    });
  const close = () => {
    setDialogOpen(false);
    setEditing(null);
    create.reset();
    update.reset();
  };
  const create = useCatalogManagementCreateCategory({
    mutation: {
      onSuccess: async () => {
        close();
        await invalidate();
      },
    },
  });
  const update = useCatalogManagementUpdateCategory({
    mutation: {
      onSuccess: async () => {
        close();
        await invalidate();
      },
    },
  });
  const archive = useCatalogManagementArchiveCategory({
    mutation: { onSuccess: invalidate },
  });
  const restore = useCatalogManagementRestoreCategory({
    mutation: { onSuccess: invalidate },
  });
  const mutationError =
    create.error ?? update.error ?? archive.error ?? restore.error;
  return (
    <SellerGuard>
      <PageHeader
        eyebrow="Seller catalog"
        title="Categories"
        description="Organize products into store-scoped categories."
        actions={
          <AppButton onClick={() => setDialogOpen(true)}>
            Add category
          </AppButton>
        }
      />
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <SearchField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search categories"
            sx={{ flex: 1 }}
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(
                event.target.value as
                  CatalogManagementListCategoriesStatus | "all",
              );
              setPage(1);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
          <TextField
            select
            label="Visibility"
            value={archived ? "archived" : "current"}
            onChange={(event) => {
              setArchived(event.target.value === "archived");
              setPage(1);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="current">Current</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </TextField>
        </Stack>
      </Paper>
      {mutationError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getApiErrorMessage(mutationError, "Unable to update category.")}
        </Alert>
      ) : null}
      {categories.isPending ? (
        <LoadingState label="Loading categories…" />
      ) : null}
      {categories.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(categories.error, "Unable to load categories.")}
        </Alert>
      ) : null}
      {categories.data?.items.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Create a category or adjust the filters."
        />
      ) : null}
      {categories.data?.items.length ? (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sort</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.data.items.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          category.archivedAt ? "archived" : category.status
                        }
                        color={
                          category.archivedAt
                            ? "default"
                            : category.status === "active"
                              ? "success"
                              : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ justifyContent: "flex-end" }}
                      >
                        <AppButton
                          variant="text"
                          onClick={() => {
                            setEditing(category);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </AppButton>
                        <AppButton
                          variant="outlined"
                          onClick={() =>
                            category.archivedAt
                              ? restore.mutate({ categoryId: category.id })
                              : archive.mutate({ categoryId: category.id })
                          }
                        >
                          {category.archivedAt ? "Restore" : "Archive"}
                        </AppButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          {categories.data.totalPages > 1 ? (
            <Pagination
              page={page}
              count={categories.data.totalPages}
              onChange={(_, value) => setPage(value)}
            />
          ) : null}
        </Stack>
      ) : null}
      <CategoryDialog
        open={dialogOpen}
        category={editing}
        loading={create.isPending || update.isPending}
        error={create.error ?? update.error}
        onClose={close}
        onSubmit={(data) => {
          const { slug, ...rest } = data;
          const normalized = {
            ...rest,
            ...(slug ? { slug } : {}),
            description: data.description || null,
          };
          if (editing)
            update.mutate({ categoryId: editing.id, data: normalized });
          else create.mutate({ data: normalized });
        }}
      />
    </SellerGuard>
  );
}
