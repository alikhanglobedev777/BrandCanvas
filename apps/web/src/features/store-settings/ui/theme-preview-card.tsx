"use client";

import type {
  SaveThemeDraftDto,
  StoreSettingsResponseDto,
} from "@brandcanvas/contracts";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

function resolveFontFamily(
  font: SaveThemeDraftDto["typography"]["headingFont"],
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
  theme: SaveThemeDraftDto;
  settings: StoreSettingsResponseDto | undefined;
}

export function ThemePreviewCard({ theme, settings }: ThemePreviewCardProps) {
  return (
    <Card
      sx={{
        bgcolor: theme.colors.background,
        color: theme.colors.text,
        borderColor: theme.colors.secondary,
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Stack
          spacing={0}
          sx={{
            minHeight: 360,
            fontFamily: resolveFontFamily(theme.typography.bodyFont),
          }}
        >
          <Stack
            direction={
              theme.header.layout === "logo_centered" ? "column" : "row"
            }
            spacing={2}
            sx={{
              alignItems:
                theme.header.layout === "logo_centered" ? "center" : "center",
              justifyContent:
                theme.header.layout === "logo_centered"
                  ? "center"
                  : "space-between",
              px: 3,
              py: 2.5,
              bgcolor: theme.colors.primary,
              color: "#FFFFFF",
              textAlign:
                theme.header.layout === "logo_centered" ? "center" : "left",
            }}
          >
            <Stack
              spacing={0.5}
              sx={{
                alignItems:
                  theme.header.layout === "logo_centered"
                    ? "center"
                    : "flex-start",
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
              <Typography variant="body2" sx={{ opacity: 0.88 }}>
                {theme.header.showLogo ? "Logo visible" : "Text-first header"}
              </Typography>
            </Stack>
            <Chip
              label={theme.header.sticky ? "Sticky header" : "Static header"}
              sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "inherit" }}
            />
          </Stack>

          <Stack spacing={2} sx={{ p: 3, flex: 1 }}>
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
                  "Draft theme changes are previewed locally here before you publish them to customers."}
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Chip
                label={`Primary ${theme.colors.primary}`}
                sx={{ bgcolor: theme.colors.primary, color: "#FFFFFF" }}
              />
              <Chip
                label={`Secondary ${theme.colors.secondary}`}
                sx={{ bgcolor: theme.colors.secondary, color: "#FFFFFF" }}
              />
            </Stack>
          </Stack>

          <Divider
            sx={{ borderColor: theme.colors.secondary, opacity: 0.35 }}
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              p: 3,
              alignItems: { sm: "center" },
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
