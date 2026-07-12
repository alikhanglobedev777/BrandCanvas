import type { SaveThemeDraftDto } from "@brandcanvas/contracts";

export interface StoreBrandingFormValues
  extends Omit<SaveThemeDraftDto, "expectedRevision" | "footer"> {
  footer: Omit<SaveThemeDraftDto["footer"], "text"> & {
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
  | "header.style"
  | "header.sticky"
  | "header.showLogo"
  | "footer.style"
  | "footer.showContact"
  | "footer.text"
  | "buttonRadius"
  | "cardRadius"
  | "productCardStyle";

export const STORE_BRANDING_FIELD_PATHS: Record<StoreBrandingFieldPath, true> = {
  "colors.primary": true,
  "colors.secondary": true,
  "colors.background": true,
  "colors.text": true,
  "typography.headingFont": true,
  "typography.bodyFont": true,
  "header.layout": true,
  "header.style": true,
  "header.sticky": true,
  "header.showLogo": true,
  "footer.style": true,
  "footer.showContact": true,
  "footer.text": true,
  buttonRadius: true,
  cardRadius: true,
  productCardStyle: true,
};

export const storeFontOptions = [
  { value: "system_sans", label: "System Sans" },
  { value: "system_serif", label: "System Serif" },
  { value: "georgia", label: "Georgia" },
  { value: "arial", label: "Arial" },
  { value: "verdana", label: "Verdana" },
] as const satisfies ReadonlyArray<{
  value: SaveThemeDraftDto["typography"]["headingFont"];
  label: string;
}>;

export const storeHeaderLayoutOptions = [
  { value: "logo_left", label: "Logo left" },
  { value: "logo_centered", label: "Logo centered" },
] as const satisfies ReadonlyArray<{
  value: SaveThemeDraftDto["header"]["layout"];
  label: string;
}>;

export const storeHeaderStyleOptions = [
  { value: "solid", label: "Solid color" },
  { value: "minimal", label: "Minimal" },
] as const satisfies ReadonlyArray<{
  value: SaveThemeDraftDto["header"]["style"];
  label: string;
}>;

export const storeFooterStyleOptions = [
  { value: "simple", label: "Simple" },
  { value: "columns", label: "Columns" },
] as const satisfies ReadonlyArray<{
  value: SaveThemeDraftDto["footer"]["style"];
  label: string;
}>;

export const storeProductCardStyleOptions = [
  { value: "minimal", label: "Minimal" },
  { value: "bordered", label: "Bordered" },
  { value: "elevated", label: "Elevated" },
] as const satisfies ReadonlyArray<{
  value: SaveThemeDraftDto["productCardStyle"];
  label: string;
}>;

export const defaultStoreBrandingValues: StoreBrandingFormValues = {
  colors: {
    primary: "#4F46E5",
    secondary: "#0F766E",
    background: "#FFFFFF",
    text: "#111827",
  },
  typography: {
    headingFont: "system_sans",
    bodyFont: "system_sans",
  },
  header: {
    layout: "logo_left",
    style: "solid",
    sticky: true,
    showLogo: true,
  },
  footer: {
    style: "simple",
    showContact: true,
    text: "",
  },
  buttonRadius: 8,
  cardRadius: 12,
  productCardStyle: "bordered",
};
