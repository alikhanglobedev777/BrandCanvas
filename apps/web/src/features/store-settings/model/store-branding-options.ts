import {
  ThemeHeaderDtoLayout,
  ThemeTypographyDtoBodyFont,
  ThemeTypographyDtoHeadingFont,
  type SaveThemeDraftDto,
} from "@brandcanvas/contracts";

export interface StoreBrandingFormValues extends SaveThemeDraftDto {
  footer: {
    showContact: boolean;
    text: string;
  };
}

export type StoreBrandingFieldPath =
  | "colors.primary"
  | "colors.secondary"
  | "colors.background"
  | "colors.text"
  | "typography.headingFont"
  | "typography.bodyFont"
  | "header.layout"
  | "header.sticky"
  | "header.showLogo"
  | "footer.showContact"
  | "footer.text";

export const STORE_BRANDING_FIELD_PATHS: Record<StoreBrandingFieldPath, true> =
  {
    "colors.primary": true,
    "colors.secondary": true,
    "colors.background": true,
    "colors.text": true,
    "typography.headingFont": true,
    "typography.bodyFont": true,
    "header.layout": true,
    "header.sticky": true,
    "header.showLogo": true,
    "footer.showContact": true,
    "footer.text": true,
  };

export const storeFontOptions = [
  { value: ThemeTypographyDtoHeadingFont.system_sans, label: "System Sans" },
  { value: ThemeTypographyDtoHeadingFont.system_serif, label: "System Serif" },
  { value: ThemeTypographyDtoHeadingFont.georgia, label: "Georgia" },
  { value: ThemeTypographyDtoHeadingFont.arial, label: "Arial" },
  { value: ThemeTypographyDtoHeadingFont.verdana, label: "Verdana" },
] as const;

export const storeHeaderLayoutOptions = [
  { value: ThemeHeaderDtoLayout.logo_left, label: "Logo left" },
  { value: ThemeHeaderDtoLayout.logo_centered, label: "Logo centered" },
] as const;

export const defaultStoreBrandingValues: StoreBrandingFormValues = {
  colors: {
    primary: "#4F46E5",
    secondary: "#0F766E",
    background: "#FFFFFF",
    text: "#111827",
  },
  typography: {
    headingFont: ThemeTypographyDtoHeadingFont.system_sans,
    bodyFont: ThemeTypographyDtoBodyFont.system_sans,
  },
  header: {
    layout: ThemeHeaderDtoLayout.logo_left,
    sticky: true,
    showLogo: true,
  },
  footer: {
    showContact: true,
    text: "",
  },
};
