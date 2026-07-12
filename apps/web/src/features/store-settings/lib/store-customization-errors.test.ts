import { ApiError } from "@brandcanvas/contracts";
import { describe, expect, it } from "vitest";
import {
  getStoreCustomizationValidationMessages,
  isStoreCustomizationAccessError,
} from "./store-customization-errors";

describe("store-customization-errors", () => {
  it("flattens nested validation details into field paths", () => {
    const error = new ApiError(400, "Request validation failed.", {
      code: "VALIDATION_FAILED",
      details: [
        {
          property: "socialLinks",
          children: [
            {
              property: "instagramUrl",
              constraints: { isUrl: "instagramUrl must be a URL address" },
            },
          ],
        },
        {
          property: "footer",
          children: [
            {
              property: "text",
              constraints: { maxLength: "footer text must be shorter" },
            },
          ],
        },
      ],
    });

    expect(getStoreCustomizationValidationMessages(error)).toEqual({
      "socialLinks.instagramUrl": "instagramUrl must be a URL address",
      "footer.text": "footer text must be shorter",
    });
  });

  it("detects store customization authorization failures", () => {
    const error = new ApiError(403, "Forbidden", {
      code: "STORE_CUSTOMIZATION_FORBIDDEN",
    });

    expect(isStoreCustomizationAccessError(error)).toBe(true);
  });
});
