"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import type { ReactNode } from "react";

export interface FormDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  formId: string;
  onClose: () => void;
}

export function FormDialog({
  open,
  title,
  children,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  maxWidth = "sm",
  formId,
  onClose,
}: FormDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button type="submit" form={formId} variant="contained" loading={loading}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
