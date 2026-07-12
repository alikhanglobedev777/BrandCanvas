"use client";

import {
  getSellerStoreCustomizationListAssetsQueryKey,
  useSellerStoreCustomizationListAssets,
  useSellerStoreCustomizationRemoveAsset,
  useSellerStoreCustomizationUploadAsset,
  type StoreAssetResponseDto,
} from "@brandcanvas/contracts";
import { LoadingState, PageHeader } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SellerGuard } from "@/features/authentication";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { isStoreCustomizationAccessError } from "../lib/store-customization-errors";
import { StoreAssetCard } from "../ui/store-asset-card";
import { StoreCustomizationAccessDenied } from "../ui/store-customization-access-denied";

const categories = ["logo", "favicon"] as const satisfies ReadonlyArray<
  StoreAssetResponseDto["category"]
>;

export function StoreAssetsPage() {
  const queryClient = useQueryClient();
  const [activeUploadCategory, setActiveUploadCategory] = useState<string | null>(null);
  const [activeRemoveAssetId, setActiveRemoveAssetId] = useState<string | null>(null);
  const assets = useSellerStoreCustomizationListAssets();
  const invalidateAssets = () =>
    queryClient.invalidateQueries({
      queryKey: getSellerStoreCustomizationListAssetsQueryKey(),
    });

  const upload = useSellerStoreCustomizationUploadAsset({
    mutation: {
      onMutate: ({ category }) => setActiveUploadCategory(category),
      onSuccess: async () => {
        await invalidateAssets();
        setActiveUploadCategory(null);
      },
    },
  });
  const remove = useSellerStoreCustomizationRemoveAsset({
    mutation: {
      onMutate: ({ assetId }) => setActiveRemoveAssetId(assetId),
      onSuccess: async () => {
        await invalidateAssets();
        setActiveRemoveAssetId(null);
      },
    },
  });

  let content;
  if (assets.isPending) {
    content = <LoadingState label="Loading store assets..." />;
  } else if (assets.isError) {
    content = isStoreCustomizationAccessError(assets.error) ? (
      <StoreCustomizationAccessDenied />
    ) : (
      <Alert severity="error">
        {getApiErrorMessage(assets.error, "Unable to load store assets.")}
      </Alert>
    );
  } else {
    content = (
      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid key={category} size={{ xs: 12, lg: 6 }}>
            <StoreAssetCard
              category={category}
              asset={assets.data?.items.find(
                (asset) => asset.category === category,
              )}
              uploadError={
                activeUploadCategory === category ? upload.error : null
              }
              removeError={
                activeRemoveAssetId ===
                assets.data?.items.find((asset) => asset.category === category)?.id
                  ? remove.error
                  : null
              }
              uploading={
                upload.isPending && activeUploadCategory === category
              }
              removing={
                remove.isPending &&
                activeRemoveAssetId ===
                  assets.data?.items.find((asset) => asset.category === category)?.id
              }
              onUpload={(file) =>
                upload.mutate({ category, data: { file } })
              }
              onRemove={(assetId) => remove.mutate({ assetId })}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <SellerGuard>
      <PageHeader
        eyebrow="Store branding"
        title="Logo and favicon"
        description="Upload validated brand assets. BrandCanvas optimizes images on the server and never trusts browser-provided storage paths or public URLs."
      />
      {content}
    </SellerGuard>
  );
}
