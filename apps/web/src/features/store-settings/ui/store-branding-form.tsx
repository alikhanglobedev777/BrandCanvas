"use client";

import type {
  SaveThemeDraftDto,
  StoreSettingsResponseDto,
  StoreThemeResponseDto,
  ThemeVersionListResponseDto,
} from "@brandcanvas/contracts";
import {
  AppButton,
  ConfirmationDialog,
  EmptyState,
  SummaryCard,
} from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { useStoreBrandingForm } from "../hooks/use-store-branding-form";
import {
  getStoreCustomizationValidationMessages,
  isThemeRevisionConflict,
} from "../lib/store-customization-errors";
import {
  createStoreBrandingFormValues,
  toSaveThemeDraftRequest,
} from "../lib/store-settings-form";
import {
  STORE_BRANDING_FIELD_PATHS,
  storeFontOptions,
  storeFooterStyleOptions,
  storeHeaderLayoutOptions,
  storeHeaderStyleOptions,
  storeProductCardStyleOptions,
  type StoreBrandingFieldPath,
  type StoreBrandingFormValues,
} from "../model/store-branding-options";
import { ThemePreviewCard } from "./theme-preview-card";

const colorFieldConfig = [
  { name: "colors.primary", label: "Primary color" },
  { name: "colors.secondary", label: "Secondary color" },
  { name: "colors.background", label: "Background color" },
  { name: "colors.text", label: "Text color" },
] as const;

function isStoreBrandingFieldPath(
  value: string,
): value is StoreBrandingFieldPath {
  return value in STORE_BRANDING_FIELD_PATHS;
}

function getColorErrorMessage(
  path: (typeof colorFieldConfig)[number]["name"],
  errors: ReturnType<typeof useStoreBrandingForm>["formState"]["errors"],
): string | undefined {
  if (path === "colors.primary") return errors.colors?.primary?.message;
  if (path === "colors.secondary") return errors.colors?.secondary?.message;
  if (path === "colors.background") return errors.colors?.background?.message;
  return errors.colors?.text?.message;
}

export interface StoreBrandingFormProps {
  draft: StoreThemeResponseDto;
  settings: StoreSettingsResponseDto | undefined;
  versions: ThemeVersionListResponseDto | undefined;
  saveError: unknown;
  publishError: unknown;
  rollbackError: unknown;
  saving: boolean;
  publishing: boolean;
  rollingBack: boolean;
  successMessage: string | null;
  onSaveDraft: (data: SaveThemeDraftDto) => void;
  onPublish: (expectedRevision: number) => void;
  onRollback: (version: number) => void;
  onReloadDraft: () => void;
}

export function StoreBrandingForm({
  draft,
  settings,
  versions,
  saveError,
  publishError,
  rollbackError,
  saving,
  publishing,
  rollingBack,
  successMessage,
  onSaveDraft,
  onPublish,
  onRollback,
  onReloadDraft,
}: StoreBrandingFormProps) {
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const {
    control,
    handleSubmit,
    register,
    reset,
    setError,
    watch,
    formState: { errors, isDirty },
  } = useStoreBrandingForm(draft);

  useEffect(() => {
    for (const serverError of [saveError, publishError, rollbackError]) {
      const validationMessages =
        getStoreCustomizationValidationMessages(serverError);

      for (const [path, message] of Object.entries(validationMessages)) {
        if (isStoreBrandingFieldPath(path)) {
          setError(path, { type: "server", message });
        }
      }
    }
  }, [publishError, rollbackError, saveError, setError]);

  const previewTheme: StoreBrandingFormValues = watch();
  const publishedVersion = useMemo(
    () =>
      versions?.items.find((item) => item.lifecycle === "published") ?? null,
    [versions],
  );

  const summaryCards = [
    {
      label: "Draft revision",
      value: draft.revision,
      shortLabel: "DR",
      helperText: "Increments when you save the draft.",
    },
    {
      label: "Published version",
      value: publishedVersion?.publishedVersion ?? "None",
      shortLabel: "PV",
      helperText: publishedVersion?.publishedAt
        ? `Published ${new Date(
            publishedVersion.publishedAt,
          ).toLocaleDateString()}.`
        : "No published theme yet.",
    },
    {
      label: "Stored versions",
      value: versions?.items.length ?? 0,
      shortLabel: "VH",
      helperText: "Published and archived versions are preserved for rollback.",
    },
  ];

  return (
    <>
      <Stack
        component="form"
        spacing={3}
        noValidate
        onSubmit={handleSubmit((values) =>
          onSaveDraft(toSaveThemeDraftRequest(values, draft.revision)),
        )}
      >
        {successMessage ? (
          <Alert severity="success">{successMessage}</Alert>
        ) : null}
        {saveError ? (
          <Alert
            severity="error"
            action={
              isThemeRevisionConflict(saveError) ? (
                <AppButton color="inherit" size="small" onClick={onReloadDraft}>
                  Reload draft
                </AppButton>
              ) : undefined
            }
          >
            {getApiErrorMessage(saveError, "Unable to save the theme draft.")}
          </Alert>
        ) : null}
        {publishError ? (
          <Alert
            severity="error"
            action={
              isThemeRevisionConflict(publishError) ? (
                <AppButton color="inherit" size="small" onClick={onReloadDraft}>
                  Reload draft
                </AppButton>
              ) : undefined
            }
          >
            {getApiErrorMessage(
              publishError,
              "Unable to publish the theme draft.",
            )}
          </Alert>
        ) : null}
        {rollbackError ? (
          <Alert severity="error">
            {getApiErrorMessage(
              rollbackError,
              "Unable to roll back the selected version.",
            )}
          </Alert>
        ) : null}
        {isDirty ? (
          <Alert severity="warning">
            Your preview includes unsaved changes. Save the draft before
            publishing to storefront customers.
          </Alert>
        ) : null}

        <Grid container spacing={3}>
          {summaryCards.map((card) => (
            <Grid key={card.label} size={{ xs: 12, md: 4 }}>
              <SummaryCard {...card} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, xl: 7 }}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Typography variant="h6">Theme colors</Typography>
                  <Grid container spacing={2}>
                    {colorFieldConfig.map((field) => (
                      <Grid key={field.name} size={{ xs: 12, md: 6 }}>
                        <TextField
                          label={field.label}
                          error={Boolean(
                            getColorErrorMessage(field.name, errors),
                          )}
                          helperText={getColorErrorMessage(field.name, errors)}
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Box
                                    aria-hidden="true"
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: 1,
                                      border: "1px solid",
                                      borderColor: "divider",
                                      bgcolor: watch(field.name),
                                    }}
                                  />
                                </InputAdornment>
                              ),
                            },
                          }}
                          {...register(field.name, {
                            required: "A hex color is required.",
                            pattern: {
                              value: /^#[0-9A-Fa-f]{6}$/,
                              message:
                                "Use a six-digit hex color like #4F46E5.",
                            },
                          })}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Typography variant="h6">Typography</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        control={control}
                        name="typography.headingFont"
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Heading font</InputLabel>
                            <Select {...field} label="Heading font">
                              {storeFontOptions.map((option) => (
                                <MenuItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        control={control}
                        name="typography.bodyFont"
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Body font</InputLabel>
                            <Select {...field} label="Body font">
                              {storeFontOptions.map((option) => (
                                <MenuItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Typography variant="h6">Header and footer</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        control={control}
                        name="header.layout"
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Header layout</InputLabel>
                            <Select {...field} label="Header layout">
                              {storeHeaderLayoutOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        control={control}
                        name="header.style"
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Header style</InputLabel>
                            <Select {...field} label="Header style">
                              {storeHeaderStyleOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Controller
                        control={control}
                        name="footer.style"
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Footer style</InputLabel>
                            <Select {...field} label="Footer style">
                              {storeFooterStyleOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        label="Footer text"
                        error={Boolean(errors.footer?.text)}
                        helperText={
                          errors.footer?.text?.message ??
                          "Optional short line shown below the storefront footer."
                        }
                        {...register("footer.text", {
                          maxLength: {
                            value: 200,
                            message: "Use 200 characters or fewer.",
                          },
                        })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Controller
                        control={control}
                        name="header.showLogo"
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.value}
                                onChange={(_, checked) => field.onChange(checked)}
                              />
                            }
                            label="Show logo area"
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Controller
                        control={control}
                        name="header.sticky"
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.value}
                                onChange={(_, checked) => field.onChange(checked)}
                              />
                            }
                            label="Sticky header"
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Controller
                        control={control}
                        name="footer.showContact"
                        render={({ field }) => (
                          <FormControlLabel
                            control={
                              <Switch
                                checked={field.value}
                                onChange={(_, checked) => field.onChange(checked)}
                              />
                            }
                            label="Show contact details"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2.5}>
                  <Typography variant="h6">Cards and controls</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Controller
                        control={control}
                        name="buttonRadius"
                        rules={{
                          min: { value: 0, message: "Use 0 or more." },
                          max: { value: 32, message: "Use 32 or less." },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            label="Button radius"
                            error={Boolean(errors.buttonRadius)}
                            helperText={errors.buttonRadius?.message ?? "0-32 pixels"}
                            slotProps={{ htmlInput: { min: 0, max: 32, step: 1 } }}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Controller
                        control={control}
                        name="cardRadius"
                        rules={{
                          min: { value: 0, message: "Use 0 or more." },
                          max: { value: 32, message: "Use 32 or less." },
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            label="Card radius"
                            error={Boolean(errors.cardRadius)}
                            helperText={errors.cardRadius?.message ?? "0-32 pixels"}
                            slotProps={{ htmlInput: { min: 0, max: 32, step: 1 } }}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Controller
                        control={control}
                        name="productCardStyle"
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Product card style</InputLabel>
                            <Select {...field} label="Product card style">
                              {storeProductCardStyleOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, xl: 5 }}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{
                      justifyContent: "space-between",
                      alignItems: { sm: "center" },
                    }}
                  >
                    <Typography variant="h6">Preview</Typography>
                    <Chip
                      label={isDirty ? "Unsaved preview" : "Draft synced"}
                      color={isDirty ? "warning" : "success"}
                      variant="outlined"
                    />
                  </Stack>
                  <ThemePreviewCard theme={previewTheme} settings={settings} />
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Theme versions</Typography>
                  {versions?.items.length ? (
                    <Stack spacing={1.5}>
                      {versions.items.map((version) => (
                        <Paper
                          key={version.id}
                          variant="outlined"
                          sx={{ p: 2 }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            sx={{ justifyContent: "space-between" }}
                          >
                            <Stack spacing={0.75}>
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{ flexWrap: "wrap" }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 700 }}
                                >
                                  Version {version.publishedVersion ?? "Draft"}
                                </Typography>
                                <Chip
                                  label={version.lifecycle}
                                  color={
                                    version.lifecycle === "published"
                                      ? "success"
                                      : "default"
                                  }
                                  size="small"
                                />
                              </Stack>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Revision {version.revision}
                                {version.publishedAt
                                  ? ` - ${new Date(
                                      version.publishedAt,
                                    ).toLocaleString()}`
                                  : ""}
                              </Typography>
                            </Stack>
                            <AppButton
                              type="button"
                              variant="outlined"
                              disabled={
                                rollingBack ||
                                isDirty ||
                                version.lifecycle === "published" ||
                                version.publishedVersion === null
                              }
                              onClick={() =>
                                setRollbackVersion(
                                  version.publishedVersion ?? null,
                                )
                              }
                            >
                              Roll back
                            </AppButton>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <EmptyState
                      title="No theme versions yet"
                      description="Publish your draft to create the first immutable storefront theme version."
                    />
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        <Stack
          direction={{ xs: "column-reverse", md: "row" }}
          spacing={1.5}
          sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
        >
          <Typography variant="body2" color="text.secondary">
            Draft last updated {new Date(draft.updatedAt).toLocaleString()}.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <AppButton
              type="button"
              variant="outlined"
              disabled={!isDirty || saving}
              onClick={() => reset(createStoreBrandingFormValues(draft))}
            >
              Reset changes
            </AppButton>
            <AppButton type="submit" loading={saving} disabled={!isDirty}>
              Save draft
            </AppButton>
            <AppButton
              type="button"
              disabled={publishing || isDirty}
              onClick={() => setPublishOpen(true)}
            >
              Publish theme
            </AppButton>
          </Stack>
        </Stack>
      </Stack>

      <ConfirmationDialog
        open={publishOpen}
        title="Publish current draft?"
        description="Publishing creates a new immutable storefront version from the saved draft. Customers will see the new version immediately."
        confirmLabel="Publish theme"
        loading={publishing}
        onClose={() => setPublishOpen(false)}
        onConfirm={() => {
          onPublish(draft.revision);
          setPublishOpen(false);
        }}
      />

      <ConfirmationDialog
        open={rollbackVersion !== null}
        title="Roll back theme version?"
        description="Rolling back republishes the selected historical version as a brand-new current version."
        confirmLabel="Roll back"
        loading={rollingBack}
        onClose={() => setRollbackVersion(null)}
        onConfirm={() => {
          if (rollbackVersion !== null) {
            onRollback(rollbackVersion);
          }
          setRollbackVersion(null);
        }}
      />
    </>
  );
}
