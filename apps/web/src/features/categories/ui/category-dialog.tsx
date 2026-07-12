"use client";
import type {
  CategoryResponseDto,
  CreateCategoryDto,
} from "@brandcanvas/contracts";
import { FormDialog } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

export function CategoryDialog({
  open,
  category,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  category: CategoryResponseDto | null;
  loading: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (data: CreateCategoryDto) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryDto>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      status: "active",
      sortOrder: 0,
    },
  });
  useEffect(() => {
    reset(
      category
        ? {
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            status: category.status,
            sortOrder: category.sortOrder,
          }
        : {
            name: "",
            slug: "",
            description: "",
            status: "active",
            sortOrder: 0,
          },
    );
  }, [category, open, reset]);
  const formId = "category-form";
  return (
    <FormDialog
      open={open}
      title={category ? "Edit category" : "Create category"}
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
            {getApiErrorMessage(error, "Unable to save category.")}
          </Alert>
        ) : null}
        <TextField
          label="Name"
          error={Boolean(errors.name)}
          helperText={errors.name?.message}
          {...register("name", {
            required: "Name is required.",
            maxLength: { value: 120, message: "Use 120 characters or fewer." },
          })}
        />
        <TextField
          label="Slug"
          helperText="Leave blank to generate it from the name."
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
          defaultValue="active"
          {...register("status")}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
        <TextField
          label="Sort order"
          type="number"
          {...register("sortOrder", {
            valueAsNumber: true,
            min: { value: 0, message: "Use zero or greater." },
          })}
        />
      </Stack>
    </FormDialog>
  );
}
