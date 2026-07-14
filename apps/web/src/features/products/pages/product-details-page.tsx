"use client";
import {
  type CreateProductVariantDto,
  type ProductVariantResponseDto,
  getCatalogManagementGetProductQueryKey,
  getCatalogManagementListCategoriesQueryKey,
  getCatalogManagementListCollectionsQueryKey,
  useCatalogManagementArchiveProduct,
  useCatalogManagementArchiveVariant,
  useCatalogManagementCreateOption,
  useCatalogManagementCreateOptionValue,
  useCatalogManagementCreateVariant,
  useCatalogManagementDeleteOption,
  useCatalogManagementDeleteOptionValue,
  useCatalogManagementGetProduct,
  useCatalogManagementListCategories,
  useCatalogManagementListCollections,
  useCatalogManagementRestoreProduct,
  useCatalogManagementUpdateProduct,
  useCatalogManagementUpdateVariant,
} from "@brandcanvas/contracts";
import {
  AppButton,
  EmptyState,
  LoadingState,
  PageHeader,
} from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { SellerGuard } from "@/features/authentication";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { useUnsavedChangesProtection } from "@/features/store-settings/lib/use-unsaved-changes-protection";
import {
  formToProduct,
  productToForm,
  type ProductEditFormValues,
} from "../model/product-edit-form";
import { ProductOptionsEditor } from "../ui/product-options-editor";
import { ProductImagesSection } from "../ui/product-images-section";
import { VariantDialog } from "../ui/variant-dialog";

export function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>();
  const queryClient = useQueryClient();
  const product = useCatalogManagementGetProduct(productId);
  const categories = useCatalogManagementListCategories({
    page: 1,
    pageSize: 100,
    archived: false,
  });
  const collections = useCatalogManagementListCollections({
    page: 1,
    pageSize: 100,
    archived: false,
  });
  const [variantOpen, setVariantOpen] = useState(false);
  const [editingVariant, setEditingVariant] =
    useState<ProductVariantResponseDto | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const form = useForm<ProductEditFormValues>();
  useEffect(() => {
    if (product.data) form.reset(productToForm(product.data));
  }, [form, product.data]);
  useUnsavedChangesProtection(form.formState.isDirty);
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getCatalogManagementGetProductQueryKey(productId),
      }),
      queryClient.invalidateQueries({
        queryKey: getCatalogManagementListCategoriesQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getCatalogManagementListCollectionsQueryKey(),
      }),
    ]);
  };
  const successMutation = (message: string) => async () => {
    setSuccess(message);
    await invalidate();
  };
  const update = useCatalogManagementUpdateProduct({
    mutation: {
      onSuccess: async (data) => {
        setSuccess("Product saved.");
        form.reset(productToForm(data));
        await invalidate();
      },
    },
  });
  const archive = useCatalogManagementArchiveProduct({
    mutation: { onSuccess: successMutation("Product archived.") },
  });
  const restore = useCatalogManagementRestoreProduct({
    mutation: { onSuccess: successMutation("Product restored as a draft.") },
  });
  const createOption = useCatalogManagementCreateOption({
    mutation: { onSuccess: successMutation("Option added.") },
  });
  const deleteOption = useCatalogManagementDeleteOption({
    mutation: { onSuccess: successMutation("Option removed.") },
  });
  const createValue = useCatalogManagementCreateOptionValue({
    mutation: { onSuccess: successMutation("Option value added.") },
  });
  const deleteValue = useCatalogManagementDeleteOptionValue({
    mutation: { onSuccess: successMutation("Option value removed.") },
  });
  const createVariant = useCatalogManagementCreateVariant({
    mutation: {
      onSuccess: async () => {
        setVariantOpen(false);
        setEditingVariant(null);
        await successMutation("Variant created.")();
      },
    },
  });
  const updateVariant = useCatalogManagementUpdateVariant({
    mutation: {
      onSuccess: async () => {
        setVariantOpen(false);
        setEditingVariant(null);
        await successMutation("Variant updated.")();
      },
    },
  });
  const archiveVariant = useCatalogManagementArchiveVariant({
    mutation: { onSuccess: successMutation("Variant archived.") },
  });
  const mutationError =
    update.error ??
    archive.error ??
    restore.error ??
    createOption.error ??
    deleteOption.error ??
    createValue.error ??
    deleteValue.error ??
    archiveVariant.error;
  if (product.isPending)
    return (
      <SellerGuard>
        <LoadingState label="Loading product details…" />
      </SellerGuard>
    );
  if (product.isError)
    return (
      <SellerGuard>
        <Alert severity="error">
          {getApiErrorMessage(product.error, "Unable to load product.")}
        </Alert>
      </SellerGuard>
    );
  if (!product.data)
    return (
      <SellerGuard>
        <EmptyState
          title="Product not found"
          description="This product does not exist or is outside your store."
        />
      </SellerGuard>
    );
  const data = product.data;
  const busy = update.isPending || archive.isPending || restore.isPending;
  const submitVariant = (values: CreateProductVariantDto) => {
    const normalized = { ...values, barcode: values.barcode || null };
    if (editingVariant)
      updateVariant.mutate({
        productId,
        variantId: editingVariant.id,
        data: normalized,
      });
    else createVariant.mutate({ productId, data: normalized });
  };
  return (
    <SellerGuard>
      <PageHeader
        eyebrow="Seller catalog"
        title={data.name}
        description="Edit product information, merchandising, options, variants, and inventory."
        actions={
          <Stack direction="row" spacing={1}>
            <Chip
              label={data.archivedAt ? "archived" : data.status}
              color={
                data.status === "active" && !data.archivedAt
                  ? "success"
                  : "default"
              }
            />
            <AppButton
              variant="outlined"
              disabled={busy}
              onClick={() => {
                if (data.archivedAt) restore.mutate({ productId });
                else archive.mutate({ productId });
              }}
            >
              {data.archivedAt ? "Restore" : "Archive"}
            </AppButton>
          </Stack>
        }
      />
      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      ) : null}
      {mutationError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {getApiErrorMessage(mutationError, "Unable to update product.")}
        </Alert>
      ) : null}
      <ProductImagesSection productId={productId} variants={data.variants} />
      <Stack
        component="form"
        spacing={3}
        onSubmit={form.handleSubmit((values) => {
          setSuccess(null);
          update.mutate({ productId, data: formToProduct(values) });
        })}
      >
        {form.formState.isDirty ? (
          <Alert severity="warning">You have unsaved product changes.</Alert>
        ) : null}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">General information</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Name"
                fullWidth
                {...form.register("name", { required: "Name is required." })}
              />
              <TextField
                label="Slug"
                fullWidth
                {...form.register("slug", {
                  required: true,
                  pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                })}
              />
            </Stack>
            <TextField
              label="Description"
              multiline
              minRows={4}
              {...form.register("description")}
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <TextField select label="Category" fullWidth {...field}>
                    <MenuItem value="">No category</MenuItem>
                    {categories.data?.items.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <TextField
                    select
                    label="Publication status"
                    fullWidth
                    {...field}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="active">Published</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </TextField>
                )}
              />
            </Stack>
            <TextField
              label="Keywords"
              helperText="Comma-separated search keywords."
              {...form.register("keywords")}
            />
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Pricing and identifiers</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Selling price (minor units)"
                type="number"
                {...form.register("priceMinor", {
                  valueAsNumber: true,
                  min: 0,
                })}
              />
              <TextField
                label="Compare-at price"
                type="number"
                {...form.register("compareAtPriceMinor", {
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
              />
              <TextField
                label="Cost price"
                type="number"
                {...form.register("costPriceMinor", {
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
              />
              <TextField label="Barcode" {...form.register("barcode")} />
            </Stack>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Collections</Typography>
            <Controller
              control={form.control}
              name="collectionIds"
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Assigned collections</InputLabel>
                  <Select
                    multiple
                    {...field}
                    input={<OutlinedInput label="Assigned collections" />}
                  >
                    {collections.data?.items.map((collection) => (
                      <MenuItem key={collection.id} value={collection.id}>
                        {collection.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Stack>
        </Paper>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ justifyContent: "flex-end" }}
        >
          <AppButton
            variant="outlined"
            disabled={!form.formState.isDirty || update.isPending}
            onClick={() => form.reset(productToForm(data))}
          >
            Reset
          </AppButton>
          <AppButton
            type="submit"
            loading={update.isPending}
            disabled={!form.formState.isDirty}
          >
            Save product
          </AppButton>
        </Stack>
      </Stack>
      <Stack spacing={3} sx={{ mt: 3 }}>
        <ProductOptionsEditor
          product={data}
          disabled={
            createOption.isPending ||
            deleteOption.isPending ||
            createValue.isPending ||
            deleteValue.isPending
          }
          onAddOption={(name, position) =>
            createOption.mutate({ productId, data: { name, position } })
          }
          onDeleteOption={(optionId) =>
            deleteOption.mutate({ productId, optionId })
          }
          onAddValue={(optionId, value, position) =>
            createValue.mutate({
              productId,
              optionId,
              data: { value, position },
            })
          }
          onDeleteValue={(valueId) =>
            deleteValue.mutate({ productId, valueId })
          }
        />
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              sx={{ justifyContent: "space-between" }}
              spacing={1}
            >
              <Typography variant="h6">Variants and inventory</Typography>
              <AppButton
                disabled={data.options.some(
                  (option) => option.values.length === 0,
                )}
                onClick={() => {
                  setEditingVariant(null);
                  setVariantOpen(true);
                }}
              >
                Add variant
              </AppButton>
            </Stack>
            {data.variants.map((variant) => (
              <Paper key={variant.id} variant="outlined" sx={{ p: 2 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  sx={{ justifyContent: "space-between" }}
                >
                  <Stack>
                    <Typography sx={{ fontWeight: 700 }}>
                      {variant.title} · {variant.sku}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available {variant.availableQuantity} · Reserved{" "}
                      {variant.reservedQuantity} ·{" "}
                      {variant.stockStatus.replaceAll("_", " ")}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <AppButton
                      variant="text"
                      onClick={() => {
                        setEditingVariant(variant);
                        setVariantOpen(true);
                      }}
                    >
                      Edit
                    </AppButton>
                    <AppButton
                      variant="outlined"
                      disabled={
                        variant.isDefault || Boolean(variant.archivedAt)
                      }
                      onClick={() =>
                        archiveVariant.mutate({
                          productId,
                          variantId: variant.id,
                        })
                      }
                    >
                      Archive
                    </AppButton>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Stack>
      <VariantDialog
        open={variantOpen}
        variant={editingVariant}
        product={data}
        loading={createVariant.isPending || updateVariant.isPending}
        error={createVariant.error ?? updateVariant.error}
        onClose={() => {
          setVariantOpen(false);
          setEditingVariant(null);
        }}
        onSubmit={submitVariant}
      />
    </SellerGuard>
  );
}
