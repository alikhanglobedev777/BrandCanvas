"use client";

import type { StoreSettingsResponseDto } from "@brandcanvas/contracts";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { StoreBrandingFormValues } from "../model/store-branding-options";

function resolveFontFamily(
  font: StoreBrandingFormValues["typography"]["headingFont"],
): string {
  switch (font) {
    case "system_serif":
      return "Georgia, 'Times New Roman', serif";
    case "georgia":
      return "Georgia, serif";
    case "arial":
      return "Arial, sans-serif";
    case "verdana":
      return "Verdana, sans-serif";
    case "system_sans":
    default:
      return "Inter, Arial, sans-serif";
  }
}

export interface ThemePreviewCardProps {
  theme: StoreBrandingFormValues;
  settings: StoreSettingsResponseDto | undefined;
}

export function ThemePreviewCard({ theme, settings }: ThemePreviewCardProps) {
  const minimalHeader = theme.header.style === "minimal";
  const elevatedProductCard = theme.productCardStyle === "elevated";
  const borderedProductCard = theme.productCardStyle === "bordered";

  return (
    <Card
      sx={{
        bgcolor: theme.colors.background,
        color: theme.colors.text,
        borderColor: theme.colors.secondary,
        borderRadius: `${theme.cardRadius}px`,
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Stack
          spacing={0}
          sx={{
            minHeight: 440,
            fontFamily: resolveFontFamily(theme.typography.bodyFont),
          }}
        >
          <Stack
            direction={theme.header.layout === "logo_centered" ? "column" : "row"}
            spacing={2}
            sx={{
              alignItems: "center",
              justifyContent:
                theme.header.layout === "logo_centered"
                  ? "center"
                  : "space-between",
              px: 3,
              py: 2.5,
              bgcolor: minimalHeader ? theme.colors.background : theme.colors.primary,
              color: minimalHeader ? theme.colors.text : "#FFFFFF",
              borderBottom: minimalHeader ? "1px solid" : "none",
              borderColor: theme.colors.secondary,
              textAlign: theme.header.layout === "logo_centered" ? "center" : "left",
            }}
          >
            <Stack
              spacing={0.5}
              sx={{
                alignItems:
                  theme.header.layout === "logo_centered" ? "center" : "flex-start",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontFamily: resolveFontFamily(theme.typography.headingFont),
                  fontWeight: 800,
                }}
              >
                {settings?.displayName ?? "Your store"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {theme.header.showLogo ? "Logo visible" : "Text-first header"}
              </Typography>
            </Stack>
            <Chip
              label={theme.header.sticky ? "Sticky header" : "Static header"}
              variant={minimalHeader ? "outlined" : "filled"}
              sx={
                minimalHeader
                  ? { borderColor: theme.colors.secondary, color: "inherit" }
                  : { bgcolor: "rgba(255,255,255,0.16)", color: "inherit" }
              }
            />
          </Stack>

          <Stack spacing={2.5} sx={{ p: 3, flex: 1 }}>
            <Stack spacing={1}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: resolveFontFamily(theme.typography.headingFont),
                  fontWeight: 800,
                }}
              >
                Preview your storefront voice
              </Typography>
              <Typography color="inherit">
                {settings?.description ||
                  "Draft theme changes are previewed locally before they are published to customers."}
              </Typography>
            </Stack>

            <Paper
              elevation={elevatedProductCard ? 4 : 0}
              variant={borderedProductCard ? "outlined" : "elevation"}
              sx={{
                p: 2.5,
                borderRadius: `${theme.cardRadius}px`,
                borderColor: borderedProductCard ? theme.colors.secondary : "transparent",
                bgcolor: theme.colors.background,
                color: theme.colors.text,
              }}
            >
              <Stack spacing={1.5}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: resolveFontFamily(theme.typography.headingFont),
                    fontWeight: 750,
                  }}
                >
                  Example product
                </Typography>
                <Typography variant="body2">PKR 2,500</Typography>
                <Button
                  variant="contained"
                  sx={{
                    alignSelf: "flex-start",
                    bgcolor: theme.colors.primary,
                    borderRadius: `${theme.buttonRadius}px`,
                    "&:hover": { bgcolor: theme.colors.primary },
                  }}
                >
                  Add to cart
                </Button>
              </Stack>
            </Paper>
          </Stack>

          <Divider sx={{ borderColor: theme.colors.secondary, opacity: 0.35 }} />

          <Stack
            direction={theme.footer.style === "columns" ? { xs: "column", sm: "row" } : "column"}
            spacing={2}
            sx={{
              p: 3,
              alignItems: theme.footer.style === "columns" ? { sm: "center" } : "flex-start",
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={0.5}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: resolveFontFamily(theme.typography.headingFont),
                  fontWeight: 700,
                }}
              >
                Footer
              </Typography>
              <Typography variant="body2" color="inherit">
                {theme.footer.text || "No footer message added yet."}
              </Typography>
            </Stack>
            {theme.footer.showContact ? (
              <Typography variant="body2" color="inherit">
                {settings?.contactEmail || settings?.contactPhone
                  ? `${settings.contactEmail ?? settings.contactPhone ?? ""}`
                  : "Contact details will appear here."}
              </Typography>
            ) : (
              <Typography variant="body2" color="inherit">
                Contact details hidden
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
