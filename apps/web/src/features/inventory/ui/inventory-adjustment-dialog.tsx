"use client";

import {
  InventoryAdjustmentDtoType,
  type InventoryAdjustmentDto,
  type ProductResponseDto,
} from "@brandcanvas/contracts";
import { FormDialog } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

const formId = "inventory-adjustment-form";

export function InventoryAdjustmentDialog({
  product,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  product: ProductResponseDto | null;
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (data: InventoryAdjustmentDto) => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryAdjustmentDto>({
    defaultValues: { type: InventoryAdjustmentDtoType.manual_increase, quantity: 1, reason: "" },
  });

  useEffect(() => {
    if (product) reset({ type: InventoryAdjustmentDtoType.manual_increase, quantity: 1, reason: "" });
  }, [product, reset]);

  return (
    <FormDialog
      open={Boolean(product)}
      title={`Adjust ${product?.name ?? "inventory"}`}
      formId={formId}
      submitLabel="Apply adjustment"
      loading={loading}
      onClose={onClose}
    >
      <Stack component="form" id={formId} spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
        {error ? <Alert severity="error">{getApiErrorMessage(error, "Inventory adjustment failed.")}</Alert> : null}
        <Typography color="text.secondary">
          Current on-hand stock: <strong>{product?.stockQuantity ?? 0}</strong>. Available after reservations: <strong>{product?.availableQuantity ?? 0}</strong>.
        </Typography>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <FormControl>
              <InputLabel>Adjustment type</InputLabel>
              <Select {...field} label="Adjustment type">
                <MenuItem value={InventoryAdjustmentDtoType.manual_increase}>Increase stock</MenuItem>
                <MenuItem value={InventoryAdjustmentDtoType.manual_decrease}>Decrease stock</MenuItem>
              </Select>
            </FormControl>
          )}
        />
        <TextField
          label="Quantity"
          type="number"
          error={Boolean(errors.quantity)}
          helperText={errors.quantity?.message}
          {...register("quantity", {
            valueAsNumber: true,
            required: "Quantity is required.",
            min: { value: 1, message: "Quantity must be at least 1." },
          })}
        />
        <TextField
          label="Reason"
          multiline
          minRows={3}
          error={Boolean(errors.reason)}
          helperText={errors.reason?.message}
          {...register("reason", {
            required: "Reason is required for the audit history.",
            minLength: { value: 3, message: "Use at least 3 characters." },
          })}
        />
      </Stack>
    </FormDialog>
  );
}
