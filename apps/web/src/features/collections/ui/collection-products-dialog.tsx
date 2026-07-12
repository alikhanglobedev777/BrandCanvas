"use client";
import type {
  CollectionResponseDto,
  ProductResponseDto,
} from "@brandcanvas/contracts";
import { FormDialog } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

export function CollectionProductsDialog({
  collection,
  products,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  collection: CollectionResponseDto | null;
  products: ProductResponseDto[];
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
}) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(
    () => setIds(collection?.products.map((item) => item.productId) ?? []),
    [collection],
  );
  const formId = "collection-products-form";
  return (
    <FormDialog
      open={Boolean(collection)}
      title="Assign products"
      formId={formId}
      loading={loading}
      onClose={onClose}
    >
      <Stack
        component="form"
        id={formId}
        spacing={1}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(ids);
        }}
      >
        {error ? (
          <Alert severity="error">
            {getApiErrorMessage(error, "Unable to assign products.")}
          </Alert>
        ) : null}
        {products.map((product) => (
          <FormControlLabel
            key={product.id}
            control={
              <Checkbox
                checked={ids.includes(product.id)}
                onChange={(_, checked) =>
                  setIds((current) =>
                    checked
                      ? [...current, product.id]
                      : current.filter((id) => id !== product.id),
                  )
                }
              />
            }
            label={`${product.name} (${product.sku})`}
          />
        ))}
      </Stack>
    </FormDialog>
  );
}
