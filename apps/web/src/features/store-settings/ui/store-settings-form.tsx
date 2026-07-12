"use client";

import type {
  StoreSettingsResponseDto,
  UpdateStoreSettingsDto,
} from "@brandcanvas/contracts";
import { AppButton } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { useStoreSettingsForm } from "../hooks/use-store-settings-form";
import { getStoreCustomizationValidationMessages } from "../lib/store-customization-errors";
import {
  createStoreSettingsFormValues,
  toStoreSettingsRequest,
} from "../lib/store-settings-form";
import {
  STORE_SETTINGS_FIELD_PATHS,
  type StoreSettingsFieldPath,
} from "../model/store-settings-form-values";

function isStoreSettingsFieldPath(
  value: string,
): value is StoreSettingsFieldPath {
  return value in STORE_SETTINGS_FIELD_PATHS;
}

export interface StoreSettingsFormProps {
  settings: StoreSettingsResponseDto;
  loading: boolean;
  error: unknown;
  successMessage: string | null;
  onSubmit: (data: UpdateStoreSettingsDto) => void;
}

export function StoreSettingsForm({
  settings,
  loading,
  error,
  successMessage,
  onSubmit,
}: StoreSettingsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useStoreSettingsForm(settings);

  useEffect(() => {
    const validationMessages = getStoreCustomizationValidationMessages(error);

    for (const [path, message] of Object.entries(validationMessages)) {
      if (isStoreSettingsFieldPath(path)) {
        setError(path, { type: "server", message });
      }
    }
  }, [error, setError]);

  return (
    <Stack
      component="form"
      spacing={3}
      noValidate
      onSubmit={handleSubmit((values) =>
        onSubmit(toStoreSettingsRequest(values)),
      )}
    >
      {successMessage ? (
        <Alert severity="success">{successMessage}</Alert>
      ) : null}
      {error ? (
        <Alert severity="error">
          {getApiErrorMessage(error, "Unable to update store settings.")}
        </Alert>
      ) : null}
      {isDirty ? (
        <Alert severity="warning">
          You have unsaved changes. Save before leaving this page.
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Typography variant="h6">Store profile</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Display name"
                error={Boolean(errors.displayName)}
                helperText={
                  errors.displayName?.message ??
                  "Shown across storefront headers and customer-facing touchpoints."
                }
                {...register("displayName", {
                  required: "Display name is required.",
                  minLength: {
                    value: 2,
                    message: "Use at least 2 characters.",
                  },
                  maxLength: {
                    value: 150,
                    message: "Use 150 characters or fewer.",
                  },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Support email"
                type="email"
                error={Boolean(errors.contactEmail)}
                helperText={
                  errors.contactEmail?.message ??
                  "Used when customers need direct help from your team."
                }
                {...register("contactEmail", {
                  pattern: {
                    value: /^$|^\S+@\S+\.\S+$/,
                    message: "Enter a valid email address.",
                  },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Phone"
                error={Boolean(errors.contactPhone)}
                helperText={
                  errors.contactPhone?.message ??
                  "Numbers, spaces, brackets, periods, and dashes are supported."
                }
                {...register("contactPhone", {
                  maxLength: {
                    value: 32,
                    message: "Use 32 characters or fewer.",
                  },
                  pattern: {
                    value: /^[+0-9().\-\s]*$/,
                    message: "Phone number contains unsupported characters.",
                  },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Store description"
                multiline
                minRows={4}
                error={Boolean(errors.description)}
                helperText={
                  errors.description?.message ??
                  "Keep it clear and customer-friendly. HTML is not allowed."
                }
                {...register("description", {
                  maxLength: {
                    value: 2000,
                    message: "Use 2000 characters or fewer.",
                  },
                })}
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Typography variant="h6">Social links</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Facebook"
                error={Boolean(errors.socialLinks?.facebookUrl)}
                helperText={errors.socialLinks?.facebookUrl?.message}
                {...register("socialLinks.facebookUrl", {
                  pattern: {
                    value: /^$|^https?:\/\/.+$/i,
                    message:
                      "Enter a full URL starting with http:// or https://.",
                  },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Instagram"
                error={Boolean(errors.socialLinks?.instagramUrl)}
                helperText={errors.socialLinks?.instagramUrl?.message}
                {...register("socialLinks.instagramUrl", {
                  pattern: {
                    value: /^$|^https?:\/\/.+$/i,
                    message:
                      "Enter a full URL starting with http:// or https://.",
                  },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="YouTube"
                error={Boolean(errors.socialLinks?.youtubeUrl)}
                helperText={errors.socialLinks?.youtubeUrl?.message}
                {...register("socialLinks.youtubeUrl", {
                  pattern: {
                    value: /^$|^https?:\/\/.+$/i,
                    message:
                      "Enter a full URL starting with http:// or https://.",
                  },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="TikTok"
                error={Boolean(errors.socialLinks?.tiktokUrl)}
                helperText={errors.socialLinks?.tiktokUrl?.message}
                {...register("socialLinks.tiktokUrl", {
                  pattern: {
                    value: /^$|^https?:\/\/.+$/i,
                    message:
                      "Enter a full URL starting with http:// or https://.",
                  },
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="X"
                error={Boolean(errors.socialLinks?.xUrl)}
                helperText={errors.socialLinks?.xUrl?.message}
                {...register("socialLinks.xUrl", {
                  pattern: {
                    value: /^$|^https?:\/\/.+$/i,
                    message:
                      "Enter a full URL starting with http:// or https://.",
                  },
                })}
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Typography variant="h6">Next settings contract</Typography>
          <Alert severity="info">
            Business address, store policies, and default currency are not part
            of the current generated store-customization contract yet, so they
            are shown here as disabled placeholders.
          </Alert>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Business address"
                disabled
                placeholder="Available when the API adds storefront address settings."
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Store policies"
                disabled
                multiline
                minRows={4}
                placeholder="Available when the API adds policy fields."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label="Default currency"
                disabled
                value=""
                helperText="Currency configuration is not exposed in the current seller contract."
              >
                <MenuItem value="">Not supported yet</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Stack
        direction={{ xs: "column-reverse", sm: "row" }}
        spacing={1.5}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
      >
        <Typography variant="body2" color="text.secondary">
          Last synced {new Date(settings.updatedAt).toLocaleString()}.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <AppButton
            type="button"
            variant="outlined"
            disabled={!isDirty || loading}
            onClick={() => reset(createStoreSettingsFormValues(settings))}
          >
            Reset changes
          </AppButton>
          <AppButton type="submit" loading={loading} disabled={!isDirty}>
            Save settings
          </AppButton>
        </Stack>
      </Stack>
    </Stack>
  );
}
