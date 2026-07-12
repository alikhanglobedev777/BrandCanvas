"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
      <Paper sx={{ width: "100%", maxWidth: 480, p: { xs: 3, sm: 4 } }}>{children}</Paper>
    </Box>
  );
}
