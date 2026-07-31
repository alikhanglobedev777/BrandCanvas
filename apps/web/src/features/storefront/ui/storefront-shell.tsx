"use client";

import type { PublicStorefrontDto } from "@brandcanvas/contracts";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";
import { StorefrontThemeProvider } from "./storefront-theme-provider";

export function StorefrontShell({ storefront, children }: { storefront: PublicStorefrontDto; children: ReactNode }) {
  const base = `/store/${storefront.slug}`;
  return <StorefrontThemeProvider theme={storefront.theme}>
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      <AppBar position="sticky" color="inherit" elevation={storefront.theme.headerStyle === "minimal" ? 0 : 1}>
        <Toolbar><Container maxWidth="lg"><Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack component={Link} href={base} direction="row" alignItems="center" spacing={1.5} sx={{ color: "inherit", textDecoration: "none" }}>
            {storefront.logoUrl ? <Box component="img" src={storefront.logoUrl} alt="" sx={{ width: 40, height: 40, objectFit: "contain" }} /> : null}
            <Typography variant="h6" fontWeight={800}>{storefront.name}</Typography>
          </Stack>
          <Stack direction="row" spacing={1}><Button component={Link} href={`${base}/products`}>Products</Button><Button component={Link} href={`${base}/search`}>Search</Button><Button component={Link} href={`${base}/account`}>Account</Button><Button component={Link} href={`${base}/cart`}>Cart</Button></Stack>
        </Stack></Container></Toolbar>
      </AppBar>
      <Container maxWidth="lg" component="main" sx={{ py: { xs: 3, md: 6 } }}>{children}</Container>
      <Box component="footer" sx={{ mt: 8, py: 4, borderTop: 1, borderColor: "divider" }}><Container maxWidth="lg"><Typography variant="body2">© {new Date().getFullYear()} {storefront.name}</Typography>{storefront.contactEmail ? <Typography variant="body2">{storefront.contactEmail}</Typography> : null}</Container></Box>
    </Box>
  </StorefrontThemeProvider>;
}
