import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { PublishThemeDto, SaveThemeDraftDto } from "./store-theme.dto";

const validTheme = {
  expectedRevision: 1,
  colors: {
    primary: "#112233",
    secondary: "#445566",
    background: "#FFFFFF",
    text: "#111827",
  },
  typography: { headingFont: "system_sans", bodyFont: "arial" },
  header: {
    layout: "logo_left",
    style: "solid",
    sticky: true,
    showLogo: true,
  },
  footer: { style: "simple", showContact: true, text: "© Store" },
  buttonRadius: 8,
  cardRadius: 12,
  productCardStyle: "bordered",
};

describe("SaveThemeDraftDto", () => {
  it("accepts a structured safe theme", async () => {
    const errors = await validate(
      plainToInstance(SaveThemeDraftDto, validTheme),
      {
        whitelist: true,
        forbidNonWhitelisted: true,
      },
    );
    expect(errors).toHaveLength(0);
  });

  it("rejects invalid colors, fonts, HTML, ranges, and unsupported keys", async () => {
    const invalid = {
      ...validTheme,
      expectedRevision: 0,
      colors: { ...validTheme.colors, primary: "red", customCss: "body{}" },
      typography: { ...validTheme.typography, headingFont: "remote-font" },
      footer: { ...validTheme.footer, text: "<script>alert(1)</script>" },
      buttonRadius: 100,
      productCardStyle: "custom",
      javascript: "alert(1)",
    };
    const errors = await validate(plainToInstance(SaveThemeDraftDto, invalid), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});


describe("PublishThemeDto", () => {
  it("requires the revision the seller reviewed", async () => {
    await expect(
      validate(plainToInstance(PublishThemeDto, { expectedRevision: 4 })),
    ).resolves.toHaveLength(0);

    const errors = await validate(
      plainToInstance(PublishThemeDto, { expectedRevision: 0 }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });
});
