"use client";
import type {
  CreateProductVariantDto,
  ProductDetailsResponseDto,
  ProductVariantResponseDto,
} from "@brandcanvas/contracts";
import { FormDialog } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
type VariantForm = Omit<CreateProductVariantDto, "optionValueIds"> & {
  optionValueIds: string[];
};
export function VariantDialog({
  open,
  variant,
  product,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  variant: ProductVariantResponseDto | null;
  product: ProductDetailsResponseDto;
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (data: CreateProductVariantDto) => void;
}) {
  const { register, handleSubmit, reset, watch, setValue } =
    useForm<VariantForm>();
  const selected = watch("optionValueIds") ?? [];
  const formId = "variant-form";
  useEffect(
    () =>
      reset(
        variant
          ? {
              title: variant.title,
              sku: variant.sku,
              barcode: variant.barcode ?? "",
              priceOverrideMinor: variant.priceOverrideMinor ?? null,
              compareAtPriceMinor: variant.compareAtPriceMinor ?? null,
              costPriceMinor: variant.costPriceMinor ?? null,
              stockQuantity: variant.stockQuantity,
              lowStockThreshold: variant.lowStockThreshold,
              optionValueIds: variant.optionValueIds,
              isActive: variant.isActive,
            }
          : {
              title: "",
              sku: "",
              barcode: "",
              priceOverrideMinor: null,
              compareAtPriceMinor: null,
              costPriceMinor: null,
              stockQuantity: 0,
              lowStockThreshold: 5,
              optionValueIds: [],
              isActive: true,
            },
      ),
    [open, reset, variant],
  );
  return (
    <FormDialog
      open={open}
      title={variant ? "Edit variant" : "Create variant"}
      formId={formId}
      loading={loading}
      maxWidth="md"
      onClose={onClose}
    >
      <Stack
        component="form"
        id={formId}
        spacing={2}
        onSubmit={handleSubmit(onSubmit)}
        sx={{ pt: 1 }}
      >
        {error ? (
          <Alert severity="error">
            {getApiErrorMessage(error, "Unable to save variant.")}
          </Alert>
        ) : null}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Title"
            fullWidth
            {...register("title", { required: true })}
          />
          <TextField
            label="SKU"
            fullWidth
            {...register("sku", { required: true })}
          />
        </Stack>
        <TextField label="Barcode" {...register("barcode")} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Price override (minor)"
            type="number"
            {...register("priceOverrideMinor", {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
          <TextField
            label="Compare-at (minor)"
            type="number"
            {...register("compareAtPriceMinor", {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
          <TextField
            label="Cost (minor)"
            type="number"
            {...register("costPriceMinor", {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Stock"
            type="number"
            {...register("stockQuantity", { valueAsNumber: true, min: 0 })}
          />
          <TextField
            label="Low-stock threshold"
            type="number"
            {...register("lowStockThreshold", { valueAsNumber: true, min: 0 })}
          />
        </Stack>
        {product.options.map((option) => (
          <Stack key={option.id}>
            <strong>{option.name}</strong>
            <Stack direction="row" sx={{ flexWrap: "wrap" }}>
              {option.values.map((value) => (
                <FormControlLabel
                  key={value.id}
                  control={
                    <Checkbox
                      checked={selected.includes(value.id)}
                      onChange={(_, checked) =>
                        setValue(
                          "optionValueIds",
                          checked
                            ? [
                                ...selected.filter(
                                  (id) =>
                                    !option.values.some(
                                      (item) => item.id === id,
                                    ),
                                ),
                                value.id,
                              ]
                            : selected.filter((id) => id !== value.id),
                          { shouldDirty: true },
                        )
                      }
                    />
                  }
                  label={value.value}
                />
              ))}
            </Stack>
          </Stack>
        ))}
        <FormControlLabel
          control={<Checkbox {...register("isActive")} defaultChecked />}
          label="Active"
        />
      </Stack>
    </FormDialog>
  );
}
