"use client";

import {
  getSellerStoreCustomizationGetSettingsQueryKey,
  useSellerStoreCustomizationGetSettings,
  useSellerStoreCustomizationUpdateSettings,
} from "@brandcanvas/contracts";
import { LoadingState, PageHeader } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SellerGuard } from "@/features/authentication";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { isStoreCustomizationAccessError } from "../lib/store-customization-errors";
import { StoreCustomizationAccessDenied } from "../ui/store-customization-access-denied";
import { StoreSettingsForm } from "../ui/store-settings-form";

export function StoreSettingsPage() {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const settings = useSellerStoreCustomizationGetSettings();
  const updateSettings = useSellerStoreCustomizationUpdateSettings({
    mutation: {
      onMutate: () => {
        setSuccessMessage(null);
      },
      onSuccess: async () => {
        setSuccessMessage("Store settings updated successfully.");
        await queryClient.invalidateQueries({
          queryKey: getSellerStoreCustomizationGetSettingsQueryKey(),
        });
      },
    },
  });

  let content;
  if (settings.isPending) {
    content = <LoadingState label="Loading store settings..." />;
  } else if (settings.isError) {
    content = isStoreCustomizationAccessError(settings.error) ? (
      <StoreCustomizationAccessDenied />
    ) : (
      <Alert severity="error">
        {getApiErrorMessage(settings.error, "Unable to load store settings.")}
      </Alert>
    );
  } else if (!settings.data) {
    content = (
      <Alert severity="warning">
        Store settings are not available for this account yet.
      </Alert>
    );
  } else {
    content = (
      <StoreSettingsForm
        settings={settings.data}
        loading={updateSettings.isPending}
        error={updateSettings.error}
        successMessage={successMessage}
        onSubmit={(data) => updateSettings.mutate({ data })}
      />
    );
  }

  return (
    <SellerGuard>
      <PageHeader
        eyebrow="Store settings"
        title="Store profile and contact details"
        description="Keep customer-facing profile details current and manage the contact channels that appear across your storefront."
      />
      {content}
    </SellerGuard>
  );
}
