"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: 260, textAlign: "center", px: 3 }}>
      <Box>
        <Typography variant="h6">{title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 520 }}>
          {description}
        </Typography>
        {action ? <Box sx={{ mt: 2 }}>{action}</Box> : null}
      </Box>
    </Box>
  );
}
