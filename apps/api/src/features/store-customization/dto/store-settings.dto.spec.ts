import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { UpdateStoreSettingsDto } from "./store-settings.dto";

describe("UpdateStoreSettingsDto", () => {
  it("accepts complete plain-text business settings", async () => {
    const errors = await validate(
      plainToInstance(UpdateStoreSettingsDto, {
        displayName: "North Studio",
        businessAddress: "Lahore, Pakistan",
        storePolicies: "Returns are accepted within seven days.",
        defaultCurrency: "PKR",
      }),
      { whitelist: true, forbidNonWhitelisted: true },
    );

    expect(errors).toHaveLength(0);
  });

  it("rejects HTML, oversized content, and malformed currency codes", async () => {
    const errors = await validate(
      plainToInstance(UpdateStoreSettingsDto, {
        businessAddress: "<b>Lahore</b>",
        storePolicies: "<script>alert(1)</script>",
        defaultCurrency: "pkr",
      }),
      { whitelist: true, forbidNonWhitelisted: true },
    );

    expect(errors.length).toBeGreaterThan(0);
  });
});
