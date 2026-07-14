import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductImageEntity } from "../entities";
import { StoreAssetStorage } from "../../../infrastructure/storage";
import { ProductImageRepository } from "../repositories";
import { ProductImageService } from "./product-image.service";

class TestProductImageRepository extends ProductImageRepository {
  productExists = vi.fn<ProductImageRepository["productExists"]>();
  variantExists = vi.fn<ProductImageRepository["variantExists"]>();
  list = vi.fn<ProductImageRepository["list"]>();
  find = vi.fn<ProductImageRepository["find"]>();
  create = vi.fn<ProductImageRepository["create"]>();
  update = vi.fn<ProductImageRepository["update"]>();
  reorder = vi.fn<ProductImageRepository["reorder"]>();
  setPrimary = vi.fn<ProductImageRepository["setPrimary"]>();
  delete = vi.fn<ProductImageRepository["delete"]>();
}

class TestStorage extends StoreAssetStorage {
  save = vi.fn<StoreAssetStorage["save"]>();
  remove = vi.fn<StoreAssetStorage["remove"]>();
}

const now = new Date("2026-07-15T12:00:00.000Z");
const image: ProductImageEntity = {
  id: "image-a",
  storeId: "store-a",
  productId: "product-a",
  variantId: null,
  storageProvider: "local",
  storageKey: "stores/store-a/products/generated.webp",
  publicUrl:
    "http://localhost:4000/uploads/stores/store-a/products/generated.webp",
  originalFilename: "shirt.png",
  mimeType: "image/webp",
  sizeBytes: 80,
  width: 2,
  height: 2,
  altText: null,
  position: 0,
  isPrimary: true,
  createdAt: now,
  updatedAt: now,
};

describe("ProductImageService", () => {
  let repository: TestProductImageRepository;
  let storage: TestStorage;
  let service: ProductImageService;
  let png: Buffer;

  beforeEach(async () => {
    repository = new TestProductImageRepository();
    storage = new TestStorage();
    service = new ProductImageService(
      repository,
      storage,
      new ConfigService({ STORE_ASSET_MAX_BYTES: 1_000 }),
    );
    png = await sharp({
      create: { width: 2, height: 2, channels: 4, background: "blue" },
    })
      .png()
      .toBuffer();
    repository.productExists.mockResolvedValue(true);
    storage.save.mockResolvedValue({
      storageProvider: "local",
      storageKey: image.storageKey,
      publicUrl: image.publicUrl,
      originalFilename: image.originalFilename,
      mimeType: "image/webp",
      sizeBytes: image.sizeBytes,
      width: image.width,
      height: image.height,
    });
    repository.create.mockResolvedValue(image);
  });

  it("verifies, re-encodes, and stores a valid upload", async () => {
    const result = await service.upload("store-a", "product-a", {
      originalFilename: "shirt.png",
      declaredMimeType: "image/png",
      content: png,
    });
    expect(storage.save).toHaveBeenCalledWith(
      expect.objectContaining({ category: "products", mimeType: "image/webp" }),
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: "store-a", productId: "product-a" }),
    );
    expect(result.id).toBe("image-a");
  });

  it("rejects an invalid file signature", async () => {
    await expect(
      service.upload("store-a", "product-a", {
        originalFilename: "fake.png",
        declaredMimeType: "image/png",
        content: Buffer.from("not an image"),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it("rejects SVG uploads", async () => {
    await expect(
      service.upload("store-a", "product-a", {
        originalFilename: "unsafe.svg",
        declaredMimeType: "image/svg+xml",
        content: Buffer.from("<svg/>"),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects oversized uploads", async () => {
    await expect(
      service.upload("store-a", "product-a", {
        originalFilename: "large.png",
        declaredMimeType: "image/png",
        content: Buffer.alloc(1_001),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects cross-store product access as not found", async () => {
    repository.productExists.mockResolvedValue(false);
    await expect(
      service.upload("store-b", "product-a", {
        originalFilename: "shirt.png",
        declaredMimeType: "image/png",
        content: png,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects a variant belonging to another product", async () => {
    repository.variantExists.mockResolvedValue(false);
    await expect(
      service.update("store-a", "product-a", "image-a", {
        variantId: "11111111-1111-4111-8111-111111111111",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns deterministic reordered images", async () => {
    repository.reorder.mockResolvedValue([
      { ...image, id: "image-b", position: 0 },
      { ...image, position: 1, isPrimary: false },
    ]);
    const result = await service.reorder("store-a", "product-a", [
      "image-b",
      "image-a",
    ]);
    expect(result.items.map((entry) => entry.id)).toEqual([
      "image-b",
      "image-a",
    ]);
  });

  it("sets a single primary image", async () => {
    repository.setPrimary.mockResolvedValue([{ ...image, isPrimary: true }]);
    const result = await service.setPrimary("store-a", "product-a", "image-a");
    expect(result.items[0]?.isPrimary).toBe(true);
  });

  it("deletes metadata and cleans up stored content", async () => {
    repository.delete.mockResolvedValue(image);
    await service.delete("store-a", "product-a", "image-a");
    expect(storage.remove).toHaveBeenCalledWith(image.storageKey);
  });

  it("cleans up stored content when metadata persistence fails", async () => {
    repository.create.mockRejectedValue(new Error("database unavailable"));
    await expect(
      service.upload("store-a", "product-a", {
        originalFilename: "shirt.png",
        declaredMimeType: "image/png",
        content: png,
      }),
    ).rejects.toThrow("database unavailable");
    expect(storage.remove).toHaveBeenCalledWith(image.storageKey);
  });
});
