"use client";
import {
  type CollectionResponseDto,
  type CatalogManagementListCollectionsStatus,
  getCatalogManagementListCollectionsQueryKey,
  useCatalogFindMany,
  useCatalogManagementAddCollectionProducts,
  useCatalogManagementArchiveCollection,
  useCatalogManagementCreateCollection,
  useCatalogManagementListCollections,
  useCatalogManagementRemoveCollectionProducts,
  useCatalogManagementReorderCollectionProducts,
  useCatalogManagementRestoreCollection,
  useCatalogManagementUpdateCollection,
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
import { CollectionDialog } from "../ui/collection-dialog";
import { CollectionProductsDialog } from "../ui/collection-products-dialog";

export function CollectionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<
    CatalogManagementListCollectionsStatus | "all"
  >("all");
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<CollectionResponseDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState<CollectionResponseDto | null>(
    null,
  );
  const collections = useCatalogManagementListCollections({
    page,
    pageSize: 10,
    archived,
    ...(deferredSearch.trim() ? { search: deferredSearch.trim() } : {}),
    ...(status !== "all" ? { status } : {}),
  });
  const products = useCatalogFindMany({ page: 1, pageSize: 100 });
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: getCatalogManagementListCollectionsQueryKey(),
    });
  const close = () => {
    setDialogOpen(false);
    setEditing(null);
    create.reset();
    update.reset();
  };
  const create = useCatalogManagementCreateCollection({
    mutation: {
      onSuccess: async () => {
        close();
        await invalidate();
      },
    },
  });
  const update = useCatalogManagementUpdateCollection({
    mutation: {
      onSuccess: async () => {
        close();
        await invalidate();
      },
    },
  });
  const archive = useCatalogManagementArchiveCollection({
    mutation: { onSuccess: invalidate },
  });
  const restore = useCatalogManagementRestoreCollection({
    mutation: { onSuccess: invalidate },
  });
  const add = useCatalogManagementAddCollectionProducts();
  const remove = useCatalogManagementRemoveCollectionProducts();
  const reorder = useCatalogManagementReorderCollectionProducts({
    mutation: { onSuccess: invalidate },
  });
  const saveProducts = async (ids: string[]) => {
    if (!assigning) return;
    const current = assigning.products.map((item) => item.productId);
    const adding = ids.filter((id) => !current.includes(id));
    const removing = current.filter((id) => !ids.includes(id));
    if (adding.length)
      await add.mutateAsync({
        collectionId: assigning.id,
        data: { productIds: adding },
      });
    if (removing.length)
      await remove.mutateAsync({
        collectionId: assigning.id,
        data: { productIds: removing },
      });
    setAssigning(null);
    await invalidate();
  };
  const error = archive.error ?? restore.error ?? reorder.error;
  return (
    <SellerGuard>
      <PageHeader
        eyebrow="Seller catalog"
        title="Collections"
        description="Curate ordered groups of products and control their publication status."
        actions={
          <AppButton onClick={() => setDialogOpen(true)}>
            Add collection
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
            placeholder="Search collections"
            sx={{ flex: 1 }}
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as
                  CatalogManagementListCollectionsStatus | "all",
              )
            }
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="published">Published</MenuItem>
          </TextField>
          <TextField
            select
            label="Visibility"
            value={archived ? "archived" : "current"}
            onChange={(event) => setArchived(event.target.value === "archived")}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="current">Current</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </TextField>
        </Stack>
      </Paper>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getApiErrorMessage(error)}
        </Alert>
      ) : null}
      {collections.isPending ? (
        <LoadingState label="Loading collections…" />
      ) : null}
      {collections.isError ? (
        <Alert severity="error">
          {getApiErrorMessage(collections.error, "Unable to load collections.")}
        </Alert>
      ) : null}
      {collections.data?.items.length === 0 ? (
        <EmptyState
          title="No collections found"
          description="Create a collection or adjust the filters."
        />
      ) : null}
      {collections.data?.items.length ? (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Products</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {collections.data.items.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell>{collection.title}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          collection.archivedAt ? "archived" : collection.status
                        }
                        color={
                          collection.status === "published" &&
                          !collection.archivedAt
                            ? "success"
                            : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>{collection.products.length}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ justifyContent: "flex-end" }}
                      >
                        <AppButton
                          variant="text"
                          onClick={() => {
                            setEditing(collection);
                            setDialogOpen(true);
                          }}
                        >
                          Edit
                        </AppButton>
                        <AppButton
                          variant="text"
                          onClick={() => setAssigning(collection)}
                        >
                          Products
                        </AppButton>
                        <AppButton
                          variant="outlined"
                          onClick={() =>
                            collection.archivedAt
                              ? restore.mutate({ collectionId: collection.id })
                              : archive.mutate({ collectionId: collection.id })
                          }
                        >
                          {collection.archivedAt ? "Restore" : "Archive"}
                        </AppButton>
                      </Stack>
                      {collection.products.length > 1 ? (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ mt: 1, justifyContent: "flex-end" }}
                        >
                          {collection.products.map((item, index) => (
                            <AppButton
                              key={item.productId}
                              variant="text"
                              disabled={index === 0}
                              onClick={() => {
                                const order = collection.products.map(
                                  (product) => product.productId,
                                );
                                [order[index - 1], order[index]] = [
                                  order[index]!,
                                  order[index - 1]!,
                                ];
                                reorder.mutate({
                                  collectionId: collection.id,
                                  data: { productIds: order },
                                });
                              }}
                            >
                              ↑ {item.name}
                            </AppButton>
                          ))}
                        </Stack>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          {collections.data.totalPages > 1 ? (
            <Pagination
              page={page}
              count={collections.data.totalPages}
              onChange={(_, value) => setPage(value)}
            />
          ) : null}
        </Stack>
      ) : null}
      <CollectionDialog
        open={dialogOpen}
        collection={editing}
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
            update.mutate({ collectionId: editing.id, data: normalized });
          else create.mutate({ data: normalized });
        }}
      />
      <CollectionProductsDialog
        collection={assigning}
        products={products.data?.items ?? []}
        loading={add.isPending || remove.isPending}
        error={add.error ?? remove.error}
        onClose={() => setAssigning(null)}
        onSubmit={saveProducts}
      />
    </SellerGuard>
  );
}
