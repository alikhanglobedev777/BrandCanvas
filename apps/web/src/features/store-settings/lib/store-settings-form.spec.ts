import { describe, expect, it } from "vitest";
import {
  createStoreBrandingFormValues,
  toSaveThemeDraftRequest,
} from "./store-settings-form";

const theme = {
  id: "f65f24c8-2730-4a30-ad77-2b02169695f4",
  storeId: "7a97cad1-3556-4508-9fac-43bd5f38f580",
  lifecycle: "draft" as const,
  revision: 4,
  publishedVersion: null,
  publishedAt: null,
  colors: {
    primary: "#112233",
    secondary: "#445566",
    background: "#FFFFFF",
    text: "#111827",
  },
  typography: {
    headingFont: "georgia" as const,
    bodyFont: "system_sans" as const,
  },
  header: {
    layout: "logo_centered" as const,
    style: "minimal" as const,
    sticky: false,
    showLogo: true,
  },
  buttonRadius: 10,
  cardRadius: 16,
  productCardStyle: "elevated" as const,
  footer: {
    style: "columns" as const,
    showContact: true,
    text: null,
  },
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

describe("store theme form mapping", () => {
  it("maps every generated theme field into editable form state", () => {
    expect(createStoreBrandingFormValues(theme)).toEqual({
      colors: theme.colors,
      typography: theme.typography,
      header: theme.header,
      buttonRadius: 10,
      cardRadius: 16,
      productCardStyle: "elevated",
      footer: {
        style: "columns",
        showContact: true,
        text: "",
      },
    });
  });

  it("includes the loaded revision and normalizes blank footer text", () => {
    const values = createStoreBrandingFormValues(theme);

    expect(toSaveThemeDraftRequest(values, theme.revision)).toEqual({
      ...values,
      expectedRevision: 4,
      footer: {
        ...values.footer,
        text: null,
      },
    });
  });
});
