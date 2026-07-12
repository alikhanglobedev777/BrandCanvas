"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export interface SummaryCardProps {
  label: string;
  value: number | string;
  shortLabel: string;
  helperText?: string;
}

export function SummaryCard({ label, value, shortLabel, helperText }: SummaryCardProps) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography color="text.secondary">{label}</Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {value}
            </Typography>
            {helperText ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {helperText}
              </Typography>
            ) : null}
          </Box>
          <Box
            aria-hidden="true"
            sx={{
              display: "grid",
              placeItems: "center",
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 800,
            }}
          >
            {shortLabel}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
