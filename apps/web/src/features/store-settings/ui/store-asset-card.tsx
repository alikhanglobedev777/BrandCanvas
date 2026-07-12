"use client";

import type { StoreAssetResponseDto } from "@brandcanvas/contracts";
import { AppButton, ConfirmationDialog, EmptyState } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, useState } from "react";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

export interface StoreAssetCardProps {
  category: StoreAssetResponseDto["category"];
  asset: StoreAssetResponseDto | undefined;
  uploadError: unknown;
  removeError: unknown;
  uploading: boolean;
  removing: boolean;
  onUpload: (file: File) => void;
  onRemove: (assetId: string) => void;
}

export function StoreAssetCard({
  category,
  asset,
  uploadError,
  removeError,
  uploading,
  removing,
  onUpload,
  onRemove,
}: StoreAssetCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );
  const title = category === "logo" ? "Store logo" : "Favicon";
  const guidance =
    category === "logo"
      ? "PNG, JPEG, or WebP. The server converts it to an optimized WebP up to 1200 Ã— 1200."
      : "PNG, JPEG, or WebP. The server creates a transparent 64 Ã— 64 PNG favicon.";

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  useEffect(() => {
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [asset?.id]);

  const chooseFile = (file: File | undefined) => {
    if (!file) return;
    setSelectedFile(file);
  };

  const submitUpload = () => {
    if (!selectedFile) return;
    onUpload(selectedFile);
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar
            src={previewUrl ?? asset?.publicUrl}
            variant={category === "favicon" ? "rounded" : "square"}
            alt={title}
            sx={{
              width: category === "favicon" ? 64 : 112,
              height: category === "favicon" ? 64 : 88,
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
              objectFit: "contain",
            }}
          />
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {guidance}
            </Typography>
          </Box>
        </Stack>

        {uploadError ? (
          <Alert severity="error">
            {getApiErrorMessage(uploadError, `Unable to upload the ${category}.`)}
          </Alert>
        ) : null}
        {removeError ? (
          <Alert severity="error">
            {getApiErrorMessage(removeError, `Unable to remove the ${category}.`)}
          </Alert>
        ) : null}

        {uploading || removing ? <LinearProgress /> : null}

        {asset ? (
          <Stack spacing={0.5}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {asset.originalFilename}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {asset.width && asset.height
                ? `${asset.width} Ã— ${asset.height} Â· `
                : ""}
              {Math.max(1, Math.round(asset.sizeBytes / 1024))} KB
            </Typography>
          </Stack>
        ) : (
          <EmptyState
            title={`No ${category} uploaded`}
            description="Choose an image, preview it, and upload it to make it current."
          />
        )}

        <input
          ref={inputRef}
          hidden
          type="file"
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <AppButton
            type="button"
            variant="outlined"
            disabled={uploading || removing}
            onClick={() => inputRef.current?.click()}
          >
            Choose image
          </AppButton>
          <AppButton
            type="button"
            disabled={!selectedFile || uploading || removing}
            loading={uploading}
            onClick={submitUpload}
          >
            {asset ? "Replace" : "Upload"}
          </AppButton>
          {asset ? (
            <AppButton
              type="button"
              color="error"
              variant="text"
              disabled={uploading || removing}
              onClick={() => setRemoveOpen(true)}
            >
              Remove
            </AppButton>
          ) : null}
        </Stack>

        {selectedFile ? (
          <Typography variant="caption" color="text.secondary">
            Previewing {selectedFile.name}. Upload to save it.
          </Typography>
        ) : null}
      </Stack>

      <ConfirmationDialog
        open={removeOpen}
        title={`Remove ${title.toLowerCase()}?`}
        description="The asset will disappear from the store immediately. You can upload a replacement later."
        confirmLabel="Remove asset"
        destructive
        loading={removing}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => {
          if (asset) onRemove(asset.id);
          setRemoveOpen(false);
        }}
      />
    </Paper>
  );
}

