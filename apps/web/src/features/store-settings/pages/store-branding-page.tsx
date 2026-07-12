"use client";

import {
  getSellerStoreCustomizationGetDraftQueryKey,
  getSellerStoreCustomizationGetSettingsQueryKey,
  getSellerStoreCustomizationListVersionsQueryKey,
  useSellerStoreCustomizationGetDraft,
  useSellerStoreCustomizationGetSettings,
  useSellerStoreCustomizationListVersions,
  useSellerStoreCustomizationPublish,
  useSellerStoreCustomizationRollback,
  useSellerStoreCustomizationSaveDraft,
} from "@brandcanvas/contracts";
import { LoadingState, PageHeader } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SellerGuard } from "@/features/authentication";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { isStoreCustomizationAccessError } from "../lib/store-customization-errors";
import { StoreCustomizationAccessDenied } from "../ui/store-customization-access-denied";
import { StoreBrandingForm } from "../ui/store-branding-form";

export function StoreBrandingPage() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const draft = useSellerStoreCustomizationGetDraft();
  const settings = useSellerStoreCustomizationGetSettings();
  const versions = useSellerStoreCustomizationListVersions();

  const invalidateBranding = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getSellerStoreCustomizationGetDraftQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getSellerStoreCustomizationListVersionsQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getSellerStoreCustomizationGetSettingsQueryKey(),
      }),
    ]);
  };

  const saveDraft = useSellerStoreCustomizationSaveDraft({
    mutation: {
      onMutate: () => {
        setSuccessMessage(null);
      },
      onSuccess: async () => {
        setSuccessMessage("Theme draft saved successfully.");
        await invalidateBranding();
      },
    },
  });

  const publish = useSellerStoreCustomizationPublish({
    mutation: {
      onMutate: () => {
        setSuccessMessage(null);
      },
      onSuccess: async () => {
        setSuccessMessage("Theme published successfully.");
        await invalidateBranding();
      },
    },
  });

  const rollback = useSellerStoreCustomizationRollback({
    mutation: {
      onMutate: () => {
        setSuccessMessage(null);
      },
      onSuccess: async () => {
        setSuccessMessage("Theme rolled back and republished successfully.");
        await invalidateBranding();
      },
    },
  });

  const firstError = draft.error ?? versions.error;
  let content;

  if (draft.isPending || versions.isPending) {
    content = <LoadingState label="Loading branding workspace..." />;
  } else if (firstError) {
    content = isStoreCustomizationAccessError(firstError) ? (
      <StoreCustomizationAccessDenied />
    ) : (
      <Alert severity="error">
        {getApiErrorMessage(firstError, "Unable to load branding data.")}
      </Alert>
    );
  } else if (!draft.data) {
    content = (
      <Alert severity="warning">
        Theme draft data is not available for this account yet.
      </Alert>
    );
  } else {
    content = (
      <StoreBrandingForm
        draft={draft.data}
        settings={settings.data}
        versions={versions.data}
        saveError={saveDraft.error}
        publishError={publish.error}
        rollbackError={rollback.error}
        saving={saveDraft.isPending}
        publishing={publish.isPending}
        rollingBack={rollback.isPending}
        successMessage={successMessage}
        onSaveDraft={(data) => saveDraft.mutate({ data })}
        onPublish={() => publish.mutate()}
        onRollback={(version) => rollback.mutate({ version })}
      />
    );
  }

  return (
    <SellerGuard>
      <PageHeader
        eyebrow="Store branding"
        title="Theme draft, preview, and publishing"
        description="Tune storefront colors, typography, and layout in a draft workspace, preview them immediately, and publish only when the saved draft is ready."
      />
      {content}
    </SellerGuard>
  );
}
