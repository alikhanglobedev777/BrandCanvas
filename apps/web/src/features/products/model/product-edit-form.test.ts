import type { ProductDetailsResponseDto } from "@brandcanvas/contracts";
import { describe, expect, it } from "vitest";
import { formToProduct, productToForm } from "./product-edit-form";

const product: ProductDetailsResponseDto = {
  id: "product-a",
  storeId: "store-a",
  name: "Shirt",
  slug: "shirt",
  description: null,
  categoryId: null,
  priceMinor: 1000,
  compareAtPriceMinor: 1200,
  costPriceMinor: null,
  barcode: null,
  keywords: ["cotton"],
  status: "draft",
  archivedAt: null,
  collectionIds: [],
  options: [],
  variants: [],
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};
describe("product edit form mapping", () => {
  it("loads generated product details into editable values", () => {
    expect(productToForm(product)).toMatchObject({
      description: "",
      categoryId: "",
      keywords: "cotton",
    });
  });
  it("normalizes blank nullable values and comma-separated keywords", () => {
    expect(
      formToProduct({
        ...productToForm(product),
        description: " ",
        barcode: " ",
        keywords: " Cotton, Summer ",
      }),
    ).toMatchObject({
      description: null,
      barcode: null,
      keywords: ["Cotton", "Summer"],
    });
  });
});
