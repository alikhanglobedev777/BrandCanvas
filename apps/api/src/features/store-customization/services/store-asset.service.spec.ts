import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppEnvironment } from "../../../config/env.schema";
import {
  StoreAssetStorage,
  type SaveStoreAssetFileInput,
  type StoredStoreAssetFile,
} from "../../../infrastructure/storage";
import type { StoreAssetEntity } from "../entities";
import { StoreCustomizationRepository } from "../repositories";
import { StoreAssetService } from "./store-asset.service";

class AssetTestRepository extends StoreCustomizationRepository {
  findSellerAccess = vi.fn<StoreCustomizationRepository["findSellerAccess"]>();
  findSettings = vi.fn<StoreCustomizationRepository["findSettings"]>();
  updateSettings = vi.fn<StoreCustomizationRepository["updateSettings"]>();
  findDraft = vi.fn<StoreCustomizationRepository["findDraft"]>();
  findPublished = vi.fn<StoreCustomizationRepository["findPublished"]>();
  findPublicPublishedBySlug =
    vi.fn<StoreCustomizationRepository["findPublicPublishedBySlug"]>();
  saveDraft = vi.fn<StoreCustomizationRepository["saveDraft"]>();
  publishDraft = vi.fn<StoreCustomizationRepository["publishDraft"]>();
  listPublishedVersions =
    vi.fn<StoreCustomizationRepository["listPublishedVersions"]>();
  rollback = vi.fn<StoreCustomizationRepository["rollback"]>();
  listCurrentAssets =
    vi.fn<StoreCustomizationRepository["listCurrentAssets"]>();
  replaceCurrentAsset =
    vi.fn<StoreCustomizationRepository["replaceCurrentAsset"]>();
  deleteAsset = vi.fn<StoreCustomizationRepository["deleteAsset"]>();
}

class AssetTestStorage extends StoreAssetStorage {
  save = vi.fn(
    async (input: SaveStoreAssetFileInput): Promise<StoredStoreAssetFile> => ({
      storageProvider: "local",
      storageKey: `stores/${input.storeId}/${input.category}/new.${input.extension}`,
      publicUrl: `http://localhost:4000/uploads/stores/${input.storeId}/${input.category}/new.${input.extension}`,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: input.content.byteLength,
      width: input.width,
      height: input.height,
    }),
  );
  remove = vi.fn(async () => undefined);
}

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const now = new Date("2026-07-12T12:00:00.000Z");

function asset(overrides: Partial<StoreAssetEntity> = {}): StoreAssetEntity {
  return {
    id: "e5f72998-1d4c-41ad-88e1-e79c1c13aac1",
    storeId: "store-a",
    category: "logo",
    storageProvider: "local",
    storageKey: "stores/store-a/logo/current.webp",
    publicUrl: "http://localhost:4000/uploads/stores/store-a/logo/current.webp",
    originalFilename: "logo.png",
    mimeType: "image/webp",
    sizeBytes: 100,
    width: 1,
    height: 1,
    isCurrent: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("StoreAssetService", () => {
  let repository: AssetTestRepository;
  let storage: AssetTestStorage;
  let service: StoreAssetService;

  beforeEach(() => {
    repository = new AssetTestRepository();
    storage = new AssetTestStorage();
    const config = {
      get: vi.fn(() => 5_000_000),
    } as unknown as ConfigService<AppEnvironment, true>;
    service = new StoreAssetService(repository, storage, config);
  });

  it("validates, optimizes, stores, and registers a logo", async () => {
    const created = asset({ storageKey: "stores/store-a/logo/new.webp" });
    repository.replaceCurrentAsset.mockResolvedValue({
      asset: created,
      replaced: null,
    });

    await expect(
      service.upload("store-a", "logo", {
        originalFilename: "brand logo.png",
        declaredMimeType: "image/png",
        content: png,
      }),
    ).resolves.toMatchObject({ category: "logo", mimeType: "image/webp" });

    expect(storage.save).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: "store-a",
        category: "logo",
        extension: "webp",
        mimeType: "image/webp",
      }),
    );
    expect(repository.replaceCurrentAsset).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: "store-a", category: "logo" }),
    );
  });

  it("rejects unsupported extensions and MIME declarations", async () => {
    await expect(
      service.upload("store-a", "logo", {
        originalFilename: "logo.svg",
        declaredMimeType: "image/svg+xml",
        content: png,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it("rejects a declared type that does not match the decoded file", async () => {
    await expect(
      service.upload("store-a", "logo", {
        originalFilename: "logo.jpg",
        declaredMimeType: "image/jpeg",
        content: png,
      }),
    ).rejects.toMatchObject({
      response: { code: "STORE_ASSET_IMAGE_INVALID" },
    });
  });

  it("rejects oversized input before image processing", async () => {
    await expect(
      service.upload("store-a", "favicon", {
        originalFilename: "favicon.png",
        declaredMimeType: "image/png",
        content: Buffer.alloc(5_000_001),
      }),
    ).rejects.toMatchObject({ response: { code: "STORE_ASSET_TOO_LARGE" } });
  });

  it("removes the newly stored file when the database transaction fails", async () => {
    repository.replaceCurrentAsset.mockRejectedValue(new Error("database unavailable"));

    await expect(
      service.upload("store-a", "logo", {
        originalFilename: "logo.png",
        declaredMimeType: "image/png",
        content: png,
      }),
    ).rejects.toThrow("database unavailable");

    expect(storage.remove).toHaveBeenCalledWith(
      "stores/store-a/logo/new.webp",
    );
  });

  it("replaces the old current file after the database transaction succeeds", async () => {
    repository.replaceCurrentAsset.mockResolvedValue({
      asset: asset({ storageKey: "stores/store-a/logo/new.webp" }),
      replaced: asset({ storageKey: "stores/store-a/logo/old.webp" }),
    });

    await service.upload("store-a", "logo", {
      originalFilename: "logo.png",
      declaredMimeType: "image/png",
      content: png,
    });

    expect(storage.remove).toHaveBeenCalledWith(
      "stores/store-a/logo/old.webp",
    );
  });

  it("removes only an asset returned from the store-scoped repository", async () => {
    repository.deleteAsset.mockResolvedValue(asset());
    await expect(service.remove("store-a", asset().id)).resolves.toEqual({
      message: "Store asset removed successfully.",
    });
    expect(repository.deleteAsset).toHaveBeenCalledWith("store-a", asset().id);
    expect(storage.remove).toHaveBeenCalledWith(
      "stores/store-a/logo/current.webp",
    );
  });

  it("does not reveal whether another store owns an asset", async () => {
    repository.deleteAsset.mockResolvedValue(null);
    await expect(service.remove("store-a", "other-store-asset")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
