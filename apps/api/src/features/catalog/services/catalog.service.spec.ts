import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductEntity } from "../entities";
import { CatalogRepository } from "../repositories";
import { CatalogService } from "./catalog.service";

class TestCatalogRepository extends CatalogRepository {
  findMany = vi.fn<CatalogRepository["findMany"]>();
  create = vi.fn<CatalogRepository["create"]>();
}

const now = new Date("2026-07-15T00:00:00.000Z");
const product: ProductEntity = {
  id: "product-a",
  variantId: "variant-a",
  inventoryItemId: "inventory-a",
  name: "Shirt",
  slug: "shirt",
  description: null,
  status: "draft",
  sku: "SHIRT-A",
  priceMinor: 250001,
  compareAtPriceMinor: 300001,
  stockQuantity: 5,
  reservedQuantity: 0,
  lowStockThreshold: 2,
  stockStatus: "in_stock",
  createdAt: now,
  updatedAt: now,
};

describe("CatalogService", () => {
  let repository: TestCatalogRepository;
  let service: CatalogService;

  beforeEach(() => {
    repository = new TestCatalogRepository();
    service = new CatalogService(repository);
  });

  it("persists prices as exact integer minor units", async () => {
    repository.create.mockResolvedValue(product);

    const result = await service.create("store-a", "user-a", {
      name: "Shirt",
      sku: "shirt-a",
      priceMinor: 250001,
      compareAtPriceMinor: 300001,
      initialStock: 5,
      lowStockThreshold: 2,
      status: "draft",
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        priceMinor: 250001,
        compareAtPriceMinor: 300001,
      }),
    );
    expect(result).toMatchObject({
      priceMinor: 250001,
      compareAtPriceMinor: 300001,
    });
  });

  it("rejects a compare-at price below the selling price", async () => {
    await expect(
      service.create("store-a", "user-a", {
        name: "Shirt",
        sku: "shirt-a",
        priceMinor: 300001,
        compareAtPriceMinor: 250001,
        initialStock: 0,
        lowStockThreshold: 2,
        status: "draft",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
