"use client";

import type {
  InventoryAdjustmentRequestDto,
  InventoryItemResponseDto,
} from "@brandcanvas/contracts";
import { ConfirmationDialog, FormDialog } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

const formId = "inventory-adjustment-form";

export function InventoryAdjustmentDialog({
  item,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  item: InventoryItemResponseDto | null;
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (data: InventoryAdjustmentRequestDto) => void;
}) {
  const [pending, setPending] = useState<InventoryAdjustmentRequestDto | null>(
    null,
  );
  const form = useForm<InventoryAdjustmentRequestDto>({
    defaultValues: { operation: "increase", quantity: 1, reason: "" },
  });
  const operation = form.watch("operation");

  useEffect(() => {
    if (item) {
      form.reset({ operation: "increase", quantity: 1, reason: "" });
      setPending(null);
    }
  }, [form, item]);

  const submit = (data: InventoryAdjustmentRequestDto) => {
    if (data.operation === "increase") onSubmit(data);
    else setPending(data);
  };

  return (
    <>
      <FormDialog
        open={Boolean(item)}
        title={`Adjust ${item?.productName ?? "inventory"}`}
        formId={formId}
        submitLabel="Review adjustment"
        loading={loading}
        onClose={onClose}
      >
        <Stack
          component="form"
          id={formId}
          spacing={2.5}
          onSubmit={form.handleSubmit(submit)}
          noValidate
        >
          {error ? (
            <Alert severity="error">
              {getApiErrorMessage(error, "Inventory adjustment failed.")}
            </Alert>
          ) : null}
          <Typography color="text.secondary">
            On hand: <strong>{item?.stockQuantity ?? 0}</strong>. Reserved:{" "}
            <strong>{item?.reservedQuantity ?? 0}</strong>. Available:{" "}
            <strong>{item?.availableQuantity ?? 0}</strong>.
          </Typography>
          <Controller
            control={form.control}
            name="operation"
            render={({ field }) => (
              <FormControl>
                <InputLabel>Operation</InputLabel>
                <Select {...field} label="Operation">
                  <MenuItem value="increase">Increase stock</MenuItem>
                  <MenuItem value="decrease">Decrease stock</MenuItem>
                  <MenuItem value="set">Set exact quantity</MenuItem>
                </Select>
              </FormControl>
            )}
          />
          <TextField
            label={operation === "set" ? "Exact quantity" : "Quantity"}
            type="number"
            error={Boolean(form.formState.errors.quantity)}
            helperText={form.formState.errors.quantity?.message}
            {...form.register("quantity", {
              valueAsNumber: true,
              required: "Quantity is required.",
              min: {
                value: operation === "set" ? 0 : 1,
                message:
                  operation === "set"
                    ? "Quantity cannot be negative."
                    : "Quantity must be at least 1.",
              },
            })}
          />
          <TextField
            label="Reason"
            multiline
            minRows={3}
            error={Boolean(form.formState.errors.reason)}
            helperText={form.formState.errors.reason?.message}
            {...form.register("reason", {
              required: "Reason is required for the audit ledger.",
              minLength: { value: 3, message: "Use at least 3 characters." },
            })}
          />
        </Stack>
      </FormDialog>
      <ConfirmationDialog
        open={Boolean(pending)}
        title="Confirm inventory reduction"
        description={`This will ${pending?.operation === "set" ? "set stock to" : "remove"} ${pending?.quantity ?? 0} unit(s). The immutable ledger will record this action.`}
        confirmLabel="Confirm adjustment"
        destructive
        loading={loading}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) onSubmit(pending);
        }}
      />
    </>
  );
}
