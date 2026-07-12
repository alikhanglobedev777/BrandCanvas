"use client";

import {
  type StoreResponseDto,
  type UpdateStoreStatusDto,
  UpdateStoreStatusDtoStatus,
} from "@brandcanvas/contracts";
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

const formId = "update-store-status-form";

export function UpdateStoreStatusDialog({
  store,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  store: StoreResponseDto | null;
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (data: UpdateStoreStatusDto) => void;
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateStoreStatusDto>({
    defaultValues: { status: UpdateStoreStatusDtoStatus.active, reason: "" },
  });

  useEffect(() => {
    if (store) reset({ status: store.status, reason: store.deactivationReason ?? "" });
  }, [reset, store]);

  const status = watch("status");
  const requiresReason = status === "inactive" || status === "suspended";

  return (
    <FormDialog
      open={Boolean(store)}
      title={`Manage ${store?.name ?? "store"}`}
      formId={formId}
      submitLabel="Update status"
      loading={loading}
      onClose={onClose}
    >
      <Stack component="form" id={formId} spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
        {error ? <Alert severity="error">{getApiErrorMessage(error, "Status update failed.")}</Alert> : null}
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <FormControl>
              <InputLabel>Status</InputLabel>
              <Select {...field} label="Status">
                {Object.values(UpdateStoreStatusDtoStatus).map((value) => (
                  <MenuItem key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
        <TextField
          label="Reason"
          multiline
          minRows={3}
          error={Boolean(errors.reason)}
          helperText={errors.reason?.message ?? (requiresReason ? "Required when a store is inactive or suspended." : "Optional")}
          {...register("reason", {
            validate: (value) => !requiresReason || (value?.trim().length ?? 0) >= 3 || "Enter a reason of at least 3 characters.",
          })}
        />
      </Stack>
    </FormDialog>
  );
}
