"use client";

import type { CreateStoreResponseDto } from "@brandcanvas/contracts";
import { AppButton } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export function StoreCredentialsDialog({
  result,
  onClose,
}: {
  result: CreateStoreResponseDto | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(result)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Store created successfully</DialogTitle>
      <DialogContent dividers>
        {result ? (
          <Stack spacing={2.5}>
            <Alert severity="warning">
              The temporary password is displayed only in this response. Give it securely to the seller and ask them to change it after signing in.
            </Alert>
            <Typography>
              <strong>{result.store.name}</strong> is ready at {result.store.subdomain}.brandcanvas.local.
            </Typography>
            <TextField label="Seller email" value={result.store.owner.email} slotProps={{ input: { readOnly: true } }} />
            <TextField label="Temporary password" value={result.temporaryPassword} slotProps={{ input: { readOnly: true } }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <AppButton variant="outlined" onClick={() => navigator.clipboard.writeText(result.store.owner.email)}>
                Copy email
              </AppButton>
              <AppButton variant="outlined" onClick={() => navigator.clipboard.writeText(result.temporaryPassword)}>
                Copy password
              </AppButton>
            </Stack>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <AppButton onClick={onClose}>Done</AppButton>
      </DialogActions>
    </Dialog>
  );
}
