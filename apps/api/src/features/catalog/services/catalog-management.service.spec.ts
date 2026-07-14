import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CategoryEntity,
  CollectionEntity,
  ProductDetailsEntity,
} from "../entities";
import { CatalogManagementRepository } from "../repositories/catalog-management.repository";
import { CatalogManagementService } from "./catalog-management.service";

class TestRepository extends CatalogManagementRepository {
  storeAssetExists = vi.fn<CatalogManagementRepository["storeAssetExists"]>();
  listCategories = vi.fn<CatalogManagementRepository["listCategories"]>();
  findCategory = vi.fn<CatalogManagementRepository["findCategory"]>();
  createCategory = vi.fn<CatalogManagementRepository["createCategory"]>();
  updateCategory = vi.fn<CatalogManagementRepository["updateCategory"]>();
  setCategoryArchived =
    vi.fn<CatalogManagementRepository["setCategoryArchived"]>();
  listCollections = vi.fn<CatalogManagementRepository["listCollections"]>();
  findCollection = vi.fn<CatalogManagementRepository["findCollection"]>();
  createCollection = vi.fn<CatalogManagementRepository["createCollection"]>();
  updateCollection = vi.fn<CatalogManagementRepository["updateCollection"]>();
  setCollectionArchived =
    vi.fn<CatalogManagementRepository["setCollectionArchived"]>();
  addCollectionProducts =
    vi.fn<CatalogManagementRepository["addCollectionProducts"]>();
  removeCollectionProducts =
    vi.fn<CatalogManagementRepository["removeCollectionProducts"]>();
  reorderCollectionProducts =
    vi.fn<CatalogManagementRepository["reorderCollectionProducts"]>();
  findProductDetails =
    vi.fn<CatalogManagementRepository["findProductDetails"]>();
  updateProduct = vi.fn<CatalogManagementRepository["updateProduct"]>();
  setProductArchived =
    vi.fn<CatalogManagementRepository["setProductArchived"]>();
  createOption = vi.fn<CatalogManagementRepository["createOption"]>();
  updateOption = vi.fn<CatalogManagementRepository["updateOption"]>();
  deleteOption = vi.fn<CatalogManagementRepository["deleteOption"]>();
  createOptionValue = vi.fn<CatalogManagementRepository["createOptionValue"]>();
  updateOptionValue = vi.fn<CatalogManagementRepository["updateOptionValue"]>();
  deleteOptionValue = vi.fn<CatalogManagementRepository["deleteOptionValue"]>();
  createVariant = vi.fn<CatalogManagementRepository["createVariant"]>();
  updateVariant = vi.fn<CatalogManagementRepository["updateVariant"]>();
  archiveVariant = vi.fn<CatalogManagementRepository["archiveVariant"]>();
}

const now = new Date("2026-07-12T12:00:00.000Z");
const category: CategoryEntity = {
  id: "category-a",
  storeId: "store-a",
  name: "Shirts",
  slug: "shirts",
  description: null,
  imageAssetId: null,
  sortOrder: 0,
  status: "active",
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
};
const collection: CollectionEntity = {
  id: "collection-a",
  storeId: "store-a",
  title: "Summer",
  slug: "summer",
  description: null,
  status: "draft",
  sortOrder: 0,
  archivedAt: null,
  products: [],
  createdAt: now,
  updatedAt: now,
};
const product: ProductDetailsEntity = {
  id: "product-a",
  storeId: "store-a",
  name: "Shirt",
  slug: "shirt",
  description: null,
  categoryId: null,
  priceMinor: 1000,
  compareAtPriceMinor: 1200,
  costPriceMinor: 500,
  barcode: null,
  keywords: [],
  status: "draft",
  archivedAt: null,
  collectionIds: [],
  options: [],
  variants: [],
  createdAt: now,
  updatedAt: now,
};

describe("CatalogManagementService", () => {
  let repository: TestRepository;
  let service: CatalogManagementService;
  beforeEach(() => {
    repository = new TestRepository();
    service = new CatalogManagementService(repository);
  });

  it("scopes category reads to the trusted seller store", async () => {
    repository.findCategory.mockResolvedValue(category);
    await service.getCategory("store-a", "category-a");
    expect(repository.findCategory).toHaveBeenCalledWith(
      "store-a",
      "category-a",
    );
    repository.findCategory.mockResolvedValue(null);
    await expect(
      service.getCategory("store-b", "category-a"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns a stable duplicate category slug error", async () => {
    repository.createCategory.mockRejectedValue({ code: "23505" });
    await expect(
      service.createCategory("store-a", { name: "Shirts", slug: "shirts" }),
    ).rejects.toMatchObject({ response: { code: "CATEGORY_SLUG_CONFLICT" } });
  });

  it("returns stable duplicate option and value errors", async () => {
    repository.findProductDetails.mockResolvedValue(product);
    repository.createOption.mockRejectedValue({ code: "23505" });
    await expect(
      service.createOption("store-a", "product-a", {
        name: "Size",
        position: 0,
      }),
    ).rejects.toMatchObject({ response: { code: "PRODUCT_OPTION_CONFLICT" } });
    repository.findProductDetails.mockResolvedValue({
      ...product,
      options: [{ id: "option-a", name: "Size", position: 0, values: [] }],
    });
    repository.createOptionValue.mockRejectedValue({ code: "23505" });
    await expect(
      service.createOptionValue("store-a", "product-a", "option-a", {
        value: "M",
        position: 0,
      }),
    ).rejects.toMatchObject({
      response: { code: "PRODUCT_OPTION_VALUE_CONFLICT" },
    });
  });

  it("rejects invalid selling and compare-at price relationships", async () => {
    repository.findProductDetails.mockResolvedValue(product);
    await expect(
      service.updateProduct("store-a", "product-a", {
        priceMinor: 1500,
        compareAtPriceMinor: 1400,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects duplicate variant combinations and duplicate SKUs", async () => {
    repository.findProductDetails.mockResolvedValue(product);
    repository.createVariant
      .mockResolvedValueOnce("duplicate_combination")
      .mockRejectedValueOnce({ code: "23505" });
    const input = {
      title: "Medium",
      sku: "SHIRT-M",
      stockQuantity: 2,
      lowStockThreshold: 1,
      optionValueIds: ["value-a"],
    };
    await expect(
      service.createVariant("store-a", "user-a", "product-a", input),
    ).rejects.toMatchObject({
      response: { code: "PRODUCT_VARIANT_COMBINATION_CONFLICT" },
    });
    await expect(
      service.createVariant("store-a", "user-a", "product-a", input),
    ).rejects.toMatchObject({
      response: { code: "PRODUCT_VARIANT_SKU_CONFLICT" },
    });
  });

  it("archives and restores categories, collections, and products", async () => {
    repository.setCategoryArchived.mockResolvedValue({
      ...category,
      archivedAt: now,
    });
    repository.setCollectionArchived.mockResolvedValue({
      ...collection,
      archivedAt: now,
    });
    repository.setProductArchived.mockResolvedValue({
      ...product,
      archivedAt: now,
      status: "archived",
    });
    await service.archiveCategory("store-a", "category-a");
    await service.restoreCategory("store-a", "category-a");
    await service.archiveCollection("store-a", "collection-a");
    await service.restoreCollection("store-a", "collection-a");
    await service.archiveProduct("store-a", "product-a");
    await service.restoreProduct("store-a", "product-a");
    expect(repository.setCategoryArchived).toHaveBeenNthCalledWith(
      1,
      "store-a",
      "category-a",
      true,
    );
    expect(repository.setCategoryArchived).toHaveBeenNthCalledWith(
      2,
      "store-a",
      "category-a",
      false,
    );
    expect(repository.setCollectionArchived).toHaveBeenCalledTimes(2);
    expect(repository.setProductArchived).toHaveBeenCalledTimes(2);
  });

  it("rejects duplicate collection product order entries before persistence", async () => {
    await expect(
      service.reorderCollectionProducts("store-a", "collection-a", [
        "product-a",
        "product-a",
      ]),
    ).rejects.toMatchObject({
      response: { code: "COLLECTION_PRODUCT_ORDER_INVALID" },
    });
    expect(repository.reorderCollectionProducts).not.toHaveBeenCalled();
  });
});
