"use client";

import { AppButton } from "@brandcanvas/ui";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function HomePage() {
  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "grid", placeItems: "center", py: 6 }}>
      <Container maxWidth="md">
        <Card>
          <CardContent sx={{ p: { xs: 4, md: 7 } }}>
            <Stack spacing={3}>
              <Chip label="Multi-tenant e-commerce SaaS" color="primary" variant="outlined" sx={{ alignSelf: "flex-start" }} />
              <Typography variant="h1" sx={{ fontSize: { xs: "3rem", md: "5rem" }, lineHeight: 0.95 }}>
                BrandCanvas
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 720, lineHeight: 1.6 }}>
                BrandCanvas provisions seller stores, sellers customize their storefront, and inventory stays synchronized with confirmed orders.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <AppButton href="/admin/login">Open admin login</AppButton>
                <AppButton href="/admin/dashboard" variant="outlined">
                  View dashboard
                </AppButton>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
