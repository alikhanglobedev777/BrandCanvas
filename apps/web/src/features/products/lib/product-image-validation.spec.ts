import { describe, expect, it } from "vitest";
import { validateProductImageFile } from "./product-image-validation";

describe("validateProductImageFile", () => {
  it("accepts supported images", () => {
    expect(
      validateProductImageFile({
        name: "product.webp",
        type: "image/webp",
        size: 50,
      }),
    ).toBeNull();
  });

  it("reports unsupported and potentially executable image formats", () => {
    expect(
      validateProductImageFile({
        name: "product.svg",
        type: "image/svg+xml",
        size: 50,
      }),
    ).toContain("SVG");
  });

  it("reports oversized and empty uploads", () => {
    expect(
      validateProductImageFile({
        name: "product.png",
        type: "image/png",
        size: 5_000_001,
      }),
    ).toContain("5 MB");
    expect(
      validateProductImageFile({
        name: "product.png",
        type: "image/png",
        size: 0,
      }),
    ).toContain("empty");
  });
});
