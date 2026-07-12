"use client";

import { CreateProductDtoStatus, type CreateProductDto } from "@brandcanvas/contracts";
import { FormDialog } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

const formId = "create-product-form";

export function CreateProductDialog({
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (data: CreateProductDto) => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductDto>({
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      price: "",
      compareAtPrice: "",
      initialStock: 0,
      lowStockThreshold: 5,
      status: CreateProductDtoStatus.draft,
    },
  });

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  return (
    <FormDialog open={open} title="Create product" formId={formId} submitLabel="Create product" loading={loading} onClose={onClose}>
      <Stack component="form" id={formId} spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
        {error ? <Alert severity="error">{getApiErrorMessage(error, "Product creation failed.")}</Alert> : null}
        <TextField
          label="Product name"
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
          {...register("name", { required: "Product name is required.", minLength: { value: 2, message: "Use at least 2 characters." } })}
        />
        <TextField label="Description" multiline minRows={3} {...register("description")} />
        <TextField
          label="SKU"
          error={Boolean(errors.sku)}
          helperText={errors.sku?.message}
          {...register("sku", { required: "SKU is required.", minLength: { value: 2, message: "Use at least 2 characters." } })}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Price (PKR)"
            error={Boolean(errors.price)}
            helperText={errors.price?.message}
            {...register("price", {
              required: "Price is required.",
              pattern: { value: /^\d+(?:\.\d{1,2})?$/, message: "Use a valid amount with up to 2 decimals." },
            })}
          />
          <TextField
            label="Compare-at price"
            error={Boolean(errors.compareAtPrice)}
            helperText={errors.compareAtPrice?.message}
            {...register("compareAtPrice", {
              pattern: { value: /^$|^\d+(?:\.\d{1,2})?$/, message: "Use a valid amount with up to 2 decimals." },
            })}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Initial stock"
            type="number"
            error={Boolean(errors.initialStock)}
            helperText={errors.initialStock?.message}
            {...register("initialStock", { valueAsNumber: true, min: { value: 0, message: "Stock cannot be negative." } })}
          />
          <TextField
            label="Low-stock threshold"
            type="number"
            error={Boolean(errors.lowStockThreshold)}
            helperText={errors.lowStockThreshold?.message}
            {...register("lowStockThreshold", { valueAsNumber: true, min: { value: 0, message: "Threshold cannot be negative." } })}
          />
        </Stack>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <FormControl>
              <InputLabel>Product status</InputLabel>
              <Select {...field} label="Product status">
                {Object.values(CreateProductDtoStatus).map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Stack>
    </FormDialog>
  );
}
