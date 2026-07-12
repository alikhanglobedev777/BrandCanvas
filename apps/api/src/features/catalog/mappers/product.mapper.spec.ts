import { describe, expect, it } from "vitest";
import { ProductMapper } from "./product.mapper";
describe("ProductMapper stock status", () => {
  it("calculates out-of-stock, low-stock, and in-stock from available quantity", () => {
    expect(ProductMapper.getStockStatus(0, 5)).toBe("out_of_stock");
    expect(ProductMapper.getStockStatus(3, 5)).toBe("low_stock");
    expect(ProductMapper.getStockStatus(6, 5)).toBe("in_stock");
  });
});
