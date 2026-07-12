"use client";
import type {
  CollectionResponseDto,
  CreateCollectionDto,
} from "@brandcanvas/contracts";
import { FormDialog } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

export function CollectionDialog({
  open,
  collection,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  collection: CollectionResponseDto | null;
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (data: CreateCollectionDto) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCollectionDto>();
  const formId = "collection-form";
  useEffect(
    () =>
      reset(
        collection
          ? {
              title: collection.title,
              slug: collection.slug,
              description: collection.description ?? "",
              status: collection.status,
              sortOrder: collection.sortOrder,
            }
          : {
              title: "",
              slug: "",
              description: "",
              status: "draft",
              sortOrder: 0,
            },
      ),
    [collection, open, reset],
  );
  return (
    <FormDialog
      open={open}
      title={collection ? "Edit collection" : "Create collection"}
      formId={formId}
      loading={loading}
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
            {getApiErrorMessage(error, "Unable to save collection.")}
          </Alert>
        ) : null}
        <TextField
          label="Title"
          error={Boolean(errors.title)}
          helperText={errors.title?.message}
          {...register("title", { required: "Title is required." })}
        />
        <TextField
          label="Slug"
          helperText="Leave blank to generate it from the title."
          {...register("slug", {
            pattern: {
              value: /^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message: "Use lowercase letters, numbers, and hyphens.",
            },
          })}
        />
        <TextField
          label="Description"
          multiline
          minRows={3}
          {...register("description")}
        />
        <TextField
          select
          label="Status"
          defaultValue="draft"
          {...register("status")}
        >
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="published">Published</MenuItem>
        </TextField>
        <TextField
          label="Sort order"
          type="number"
          {...register("sortOrder", { valueAsNumber: true, min: 0 })}
        />
      </Stack>
    </FormDialog>
  );
}
