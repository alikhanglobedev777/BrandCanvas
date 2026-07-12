"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: 240, gap: 2 }}>
      <CircularProgress size={32} />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  );
}
