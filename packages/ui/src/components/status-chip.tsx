"use client";

import Chip, { type ChipProps } from "@mui/material/Chip";

export type StatusTone = "success" | "warning" | "error" | "info" | "default";

export interface StatusChipProps extends Omit<ChipProps, "color"> {
  tone?: StatusTone;
}

export function StatusChip({ tone = "default", ...props }: StatusChipProps) {
  return <Chip size="small" color={tone} variant={tone === "default" ? "outlined" : "filled"} {...props} />;
}
