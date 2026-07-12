import { describe, expect, it } from "vitest";
import {
  createStoreSettingsFormValues,
  toStoreSettingsRequest,
} from "./store-settings-form";

describe("store-settings-form helpers", () => {
  it("hydrates nullable API settings into form-safe strings", () => {
    expect(
      createStoreSettingsFormValues({
        id: "settings-id",
        storeId: "store-id",
        displayName: "North Studio",
        description: null,
        contactEmail: null,
        contactPhone: null,
        businessAddress: null,
        storePolicies: null,
        defaultCurrency: "PKR",
        socialLinks: {},
        createdAt: "2026-07-12T00:00:00.000Z",
        updatedAt: "2026-07-12T00:00:00.000Z",
      }),
    ).toMatchObject({
      displayName: "North Studio",
      description: "",
      contactEmail: "",
      contactPhone: "",
      businessAddress: "",
      storePolicies: "",
      defaultCurrency: "PKR",
      socialLinks: {
        facebookUrl: "",
        instagramUrl: "",
        youtubeUrl: "",
        tiktokUrl: "",
        xUrl: "",
      },
    });
  });

  it("normalizes blank values and includes the complete generated settings contract", () => {
    expect(
      toStoreSettingsRequest({
        displayName: "  North Studio  ",
        description: "  ",
        contactEmail: " support@example.com ",
        contactPhone: "",
        socialLinks: {
          facebookUrl: "",
          instagramUrl: " https://instagram.com/north ",
          youtubeUrl: "",
          tiktokUrl: "",
          xUrl: "",
        },
        businessAddress: "  Lahore, Pakistan  ",
        storePolicies: "  Returns within 7 days.  ",
        defaultCurrency: "PKR",
      }),
    ).toEqual({
      displayName: "North Studio",
      description: null,
      contactEmail: "support@example.com",
      contactPhone: null,
      businessAddress: "Lahore, Pakistan",
      storePolicies: "Returns within 7 days.",
      defaultCurrency: "PKR",
      socialLinks: {
        facebookUrl: null,
        instagramUrl: "https://instagram.com/north",
        youtubeUrl: null,
        tiktokUrl: null,
        xUrl: null,
      },
    });
  });
});
