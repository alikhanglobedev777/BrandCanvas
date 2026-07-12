import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { SaveThemeDraftDto } from "./store-theme.dto";

const validTheme = {
  colors: {
    primary: "#112233",
    secondary: "#445566",
    background: "#FFFFFF",
    text: "#111827",
  },
  typography: { headingFont: "system_sans", bodyFont: "arial" },
  header: { layout: "logo_left", sticky: true, showLogo: true },
  footer: { showContact: true, text: "© Store" },
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

  it("rejects invalid colors, fonts, HTML, and unsupported keys", async () => {
    const invalid = {
      ...validTheme,
      colors: { ...validTheme.colors, primary: "red", customCss: "body{}" },
      typography: { ...validTheme.typography, headingFont: "remote-font" },
      footer: { ...validTheme.footer, text: "<script>alert(1)</script>" },
      javascript: "alert(1)",
    };
    const errors = await validate(plainToInstance(SaveThemeDraftDto, invalid), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
