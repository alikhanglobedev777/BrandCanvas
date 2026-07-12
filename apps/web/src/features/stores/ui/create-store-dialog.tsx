"use client";

import {
  CreateStoreDtoStatus,
  type CreateStoreDto,
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

const formId = "create-store-form";

export interface CreateStoreDialogProps {
  open: boolean;
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (data: CreateStoreDto) => void;
}

function toSubdomain(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export function CreateStoreDialog({ open, loading, error, onClose, onSubmit }: CreateStoreDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<CreateStoreDto>({
    defaultValues: {
      sellerName: "",
      sellerEmail: "",
      storeName: "",
      subdomain: "",
      status: CreateStoreDtoStatus.active,
    },
  });

  const storeName = watch("storeName");

  useEffect(() => {
    if (!dirtyFields.subdomain) setValue("subdomain", toSubdomain(storeName));
  }, [dirtyFields.subdomain, setValue, storeName]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  return (
    <FormDialog
      open={open}
      title="Create seller store"
      formId={formId}
      submitLabel="Create and generate credentials"
      loading={loading}
      onClose={onClose}
    >
      <Stack component="form" id={formId} spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
        {error ? <Alert severity="error">{getApiErrorMessage(error, "Store creation failed.")}</Alert> : null}
        <TextField
          label="Seller name"
          error={Boolean(errors.sellerName)}
          helperText={errors.sellerName?.message}
          {...register("sellerName", { required: "Seller name is required.", minLength: { value: 2, message: "Use at least 2 characters." } })}
        />
        <TextField
          label="Seller email"
          type="email"
          error={Boolean(errors.sellerEmail)}
          helperText={errors.sellerEmail?.message}
          {...register("sellerEmail", {
            required: "Seller email is required.",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email." },
          })}
        />
        <TextField
          label="Store name"
          error={Boolean(errors.storeName)}
          helperText={errors.storeName?.message}
          {...register("storeName", { required: "Store name is required.", minLength: { value: 2, message: "Use at least 2 characters." } })}
        />
        <TextField
          label="Subdomain"
          error={Boolean(errors.subdomain)}
          helperText={errors.subdomain?.message ?? ".brandcanvas.local"}
          {...register("subdomain", {
            required: "Subdomain is required.",
            minLength: { value: 3, message: "Use at least 3 characters." },
            pattern: { value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: "Use lowercase letters, numbers, and single hyphens." },
          })}
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <FormControl>
              <InputLabel>Initial status</InputLabel>
              <Select {...field} label="Initial status">
                {Object.values(CreateStoreDtoStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
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
