import { ForbiddenException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoreCustomizationRepository } from "../repositories";
import { StoreCustomizationPolicy } from "./store-customization.policy";

class PolicyTestRepository extends StoreCustomizationRepository {
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

describe("StoreCustomizationPolicy", () => {
  const repository = new PolicyTestRepository();
  let policy: StoreCustomizationPolicy;

  beforeEach(() => {
    repository.findSellerAccess.mockReset();
    policy = new StoreCustomizationPolicy(repository);
  });

  it("allows a seller owner to customize only the assigned active store", async () => {
    repository.findSellerAccess.mockResolvedValue({
      storeId: "store-a",
      status: "active",
      memberRole: "owner",
    });
    await expect(
      policy.assertSellerCanCustomize("seller-a", "store-a"),
    ).resolves.toBe("store-a");
    expect(repository.findSellerAccess).toHaveBeenCalledWith(
      "seller-a",
      "store-a",
    );
  });

  it("denies a seller without membership in the selected store", async () => {
    repository.findSellerAccess.mockResolvedValue(null);
    await expect(
      policy.assertSellerCanCustomize("seller-a", "store-b"),
    ).rejects.toMatchObject({
      response: { code: "STORE_ACCESS_DENIED" },
    });
  });

  it("denies inactive sellers", async () => {
    repository.findSellerAccess.mockResolvedValue({
      storeId: "store-a",
      status: "suspended",
      memberRole: "owner",
    });
    await expect(
      policy.assertSellerCanCustomize("seller-a", "store-a"),
    ).rejects.toMatchObject({
      response: { code: "STORE_INACTIVE" },
    });
  });

  it("denies seller staff without customization permission", async () => {
    repository.findSellerAccess.mockResolvedValue({
      storeId: "store-a",
      status: "active",
      memberRole: "catalog_manager",
    });
    await expect(
      policy.assertSellerCanCustomize("seller-a", "store-a"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
