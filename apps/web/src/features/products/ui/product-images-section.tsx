"use client";

import {
  getProductImageListQueryKey,
  type ProductImageResponseDto,
  type ProductVariantResponseDto,
  useProductImageDelete,
  useProductImageList,
  useProductImageReorder,
  useProductImageSetPrimary,
  useProductImageUpdate,
  useProductImageUpload,
} from "@brandcanvas/contracts";
import {
  AppButton,
  ConfirmationDialog,
  EmptyState,
  LoadingState,
} from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { validateProductImageFile } from "../lib/product-image-validation";

export function ProductImagesSection({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariantResponseDto[];
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<ProductImageResponseDto | null>(null);
  const images = useProductImageList(productId);
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: getProductImageListQueryKey(productId),
    });
  const upload = useProductImageUpload({ mutation: { onSuccess: invalidate } });
  const update = useProductImageUpdate({ mutation: { onSuccess: invalidate } });
  const reorder = useProductImageReorder({
    mutation: { onSuccess: invalidate },
  });
  const primary = useProductImageSetPrimary({
    mutation: { onSuccess: invalidate },
  });
  const remove = useProductImageDelete({
    mutation: {
      onSuccess: async () => {
        setDeleteTarget(null);
        await invalidate();
      },
    },
  });
  const error =
    upload.error ??
    update.error ??
    reorder.error ??
    primary.error ??
    remove.error;
  const busy =
    upload.isPending ||
    update.isPending ||
    reorder.isPending ||
    primary.isPending ||
    remove.isPending;

  const move = (imageId: string, direction: -1 | 1) => {
    const ids = images.data?.items.map((image) => image.id) ?? [];
    const index = ids.indexOf(imageId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    reorder.mutate({ productId, data: { imageIds: ids } });
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6">Product images</Typography>
            <Typography variant="body2" color="text.secondary">
              Upload JPEG, PNG, or WebP images up to 5 MB. Files are verified
              and normalized before storage.
            </Typography>
          </Stack>
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const message = validateProductImageFile(file);
              setValidationError(message);
              if (!message) upload.mutate({ productId, data: { file } });
            }}
          />
          <AppButton
            loading={upload.isPending}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            Upload image
          </AppButton>
        </Stack>
        {upload.isPending ? (
          <Stack spacing={0.5}>
            <LinearProgress aria-label="Uploading product image" />
            <Typography variant="caption" color="text.secondary">
              Verifying and processing image…
            </Typography>
          </Stack>
        ) : null}
        {validationError ? (
          <Alert severity="error">{validationError}</Alert>
        ) : null}
        {error ? (
          <Alert severity="error">
            {getApiErrorMessage(error, "Unable to update product images.")}
          </Alert>
        ) : null}
        {images.isPending ? (
          <LoadingState label="Loading product images…" />
        ) : null}
        {images.isError ? (
          <Alert severity="error">
            {getApiErrorMessage(images.error, "Unable to load product images.")}
          </Alert>
        ) : null}
        {images.data?.items.length === 0 ? (
          <EmptyState
            title="No product images"
            description="Upload an image to create the storefront gallery."
          />
        ) : null}
        {images.data?.items.length ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {images.data.items.map((image, index) => (
              <ProductImageCard
                key={image.id}
                image={image}
                variants={variants}
                index={index}
                count={images.data.items.length}
                disabled={busy}
                onMove={(direction) => move(image.id, direction)}
                onUpdate={(data) =>
                  update.mutate({ productId, imageId: image.id, data })
                }
                onPrimary={() =>
                  primary.mutate({ productId, imageId: image.id })
                }
                onDelete={() => setDeleteTarget(image)}
              />
            ))}
          </Box>
        ) : null}
      </Stack>
      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete product image?"
        description="The image metadata and stored file will be removed. This cannot be undone."
        confirmLabel="Delete image"
        destructive
        loading={remove.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget)
            remove.mutate({ productId, imageId: deleteTarget.id });
        }}
      />
    </Paper>
  );
}

function ProductImageCard({
  image,
  variants,
  index,
  count,
  disabled,
  onMove,
  onUpdate,
  onPrimary,
  onDelete,
}: {
  image: ProductImageResponseDto;
  variants: ProductVariantResponseDto[];
  index: number;
  count: number;
  disabled: boolean;
  onMove: (direction: -1 | 1) => void;
  onUpdate: (data: {
    altText?: string | null;
    variantId?: string | null;
  }) => void;
  onPrimary: () => void;
  onDelete: () => void;
}) {
  const [altText, setAltText] = useState(image.altText ?? "");
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box
        component="img"
        src={image.publicUrl}
        alt={image.altText ?? image.originalFilename}
        sx={{
          width: "100%",
          height: 220,
          objectFit: "cover",
          display: "block",
        }}
      />
      <Stack spacing={1.5} sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="body2" noWrap sx={{ flex: 1 }}>
            {image.originalFilename}
          </Typography>
          {image.isPrimary ? (
            <Chip size="small" color="primary" label="Primary" />
          ) : null}
        </Stack>
        <TextField
          size="small"
          label="Alt text"
          value={altText}
          onChange={(event) => setAltText(event.target.value)}
          onBlur={() => {
            if (altText !== (image.altText ?? "")) onUpdate({ altText });
          }}
          slotProps={{ htmlInput: { maxLength: 250 } }}
        />
        <TextField
          select
          size="small"
          label="Assigned variant"
          value={image.variantId ?? ""}
          onChange={(event) =>
            onUpdate({ variantId: event.target.value || null })
          }
        >
          <MenuItem value="">All variants</MenuItem>
          {variants.map((variant) => (
            <MenuItem key={variant.id} value={variant.id}>
              {variant.title} · {variant.sku}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
          <AppButton
            size="small"
            variant="text"
            disabled={disabled || index === 0}
            onClick={() => onMove(-1)}
          >
            Move left
          </AppButton>
          <AppButton
            size="small"
            variant="text"
            disabled={disabled || index === count - 1}
            onClick={() => onMove(1)}
          >
            Move right
          </AppButton>
          <AppButton
            size="small"
            variant="text"
            disabled={disabled || image.isPrimary}
            onClick={onPrimary}
          >
            Set primary
          </AppButton>
          <AppButton
            size="small"
            color="error"
            variant="text"
            disabled={disabled}
            onClick={onDelete}
          >
            Delete
          </AppButton>
        </Stack>
      </Stack>
    </Paper>
  );
}
