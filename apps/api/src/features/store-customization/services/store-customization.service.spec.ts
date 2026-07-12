import { ConflictException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StoreSettingsEntity, StoreThemeEntity } from "../entities";
import { StoreCustomizationRepository } from "../repositories";
import { StoreCustomizationService } from "./store-customization.service";

class ServiceTestRepository extends StoreCustomizationRepository {
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

const now = new Date("2026-07-12T12:00:00.000Z");
const settings: StoreSettingsEntity = {
  id: "settings-a",
  storeId: "store-a",
  displayName: "Store A",
  description: null,
  contactEmail: null,
  contactPhone: null,
  businessAddress: null,
  storePolicies: null,
  defaultCurrency: "PKR",
  facebookUrl: null,
  instagramUrl: null,
  youtubeUrl: null,
  tiktokUrl: null,
  xUrl: null,
  createdAt: now,
  updatedAt: now,
};

function theme(
  lifecycle: StoreThemeEntity["lifecycle"],
  version: number | null,
): StoreThemeEntity {
  return {
    id: `${lifecycle}-${version ?? "draft"}`,
    storeId: "store-a",
    lifecycle,
    revision: 2,
    publishedVersion: version,
    primaryColor: "#112233",
    secondaryColor: "#445566",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    headingFont: "system_sans",
    bodyFont: "arial",
    headerLayout: "logo_left",
    headerStyle: "solid",
    headerSticky: true,
    headerShowLogo: true,
    buttonRadius: 8,
    cardRadius: 12,
    productCardStyle: "bordered",
    footerStyle: "simple",
    footerShowContact: true,
    footerText: null,
    publishedAt: version === null ? null : now,
    createdAt: now,
    updatedAt: now,
  };
}

const draftInput = {
  expectedRevision: 2,
  colors: {
    primary: "#112233",
    secondary: "#445566",
    background: "#FFFFFF",
    text: "#111827",
  },
  typography: {
    headingFont: "system_sans" as const,
    bodyFont: "arial" as const,
  },
  header: {
    layout: "logo_left" as const,
    style: "solid" as const,
    sticky: true,
    showLogo: true,
  },
  footer: { style: "simple" as const, showContact: true, text: null },
  buttonRadius: 8,
  cardRadius: 12,
  productCardStyle: "bordered" as const,
};

describe("StoreCustomizationService", () => {
  let repository: ServiceTestRepository;
  let service: StoreCustomizationService;

  beforeEach(() => {
    repository = new ServiceTestRepository();
    service = new StoreCustomizationService(repository);
  });

  it("updates only the supplied seller store settings", async () => {
    repository.updateSettings.mockResolvedValue({
      ...settings,
      displayName: "Updated",
    });
    await expect(
      service.updateSettings("store-a", {
        displayName: " Updated ",
        businessAddress: " Lahore ",
        storePolicies: " Returns within 7 days. ",
        defaultCurrency: "pkr",
      }),
    ).resolves.toMatchObject({
      storeId: "store-a",
      displayName: "Updated",
    });
    expect(repository.updateSettings).toHaveBeenCalledWith("store-a", {
      displayName: "Updated",
      businessAddress: "Lahore",
      storePolicies: "Returns within 7 days.",
      defaultCurrency: "PKR",
    });
  });

  it("saving a draft sends the complete structured theme and expected revision", async () => {
    repository.saveDraft.mockResolvedValue(theme("draft", null));

    await service.saveDraft("store-a", draftInput);

    expect(repository.saveDraft).toHaveBeenCalledWith("store-a", {
      expectedRevision: 2,
      primaryColor: "#112233",
      secondaryColor: "#445566",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      headingFont: "system_sans",
      bodyFont: "arial",
      headerLayout: "logo_left",
      headerStyle: "solid",
      headerSticky: true,
      headerShowLogo: true,
      buttonRadius: 8,
      cardRadius: 12,
      productCardStyle: "bordered",
      footerStyle: "simple",
      footerShowContact: true,
      footerText: null,
    });
    expect(repository.publishDraft).not.toHaveBeenCalled();
  });

  it("returns a stable conflict when the draft revision is stale", async () => {
    repository.saveDraft.mockResolvedValue("revision_conflict");

    await expect(service.saveDraft("store-a", draftInput)).rejects.toMatchObject({
      response: { code: "THEME_REVISION_CONFLICT" },
    });
  });

  it("publishes only the revision the seller reviewed", async () => {
    repository.publishDraft.mockResolvedValue(theme("published", 2));
    await expect(
      service.publish("store-a", { expectedRevision: 2 }),
    ).resolves.toMatchObject({
      lifecycle: "published",
      publishedVersion: 2,
    });
    expect(repository.publishDraft).toHaveBeenCalledWith("store-a", 2);
  });

  it("rejects publishing when the saved draft changed concurrently", async () => {
    repository.publishDraft.mockResolvedValue("revision_conflict");

    await expect(
      service.publish("store-a", { expectedRevision: 2 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rollback publishes the selected historical configuration as a new version", async () => {
    repository.rollback.mockResolvedValue(theme("published", 3));
    await expect(service.rollback("store-a", 1)).resolves.toMatchObject({
      lifecycle: "published",
      publishedVersion: 3,
    });
    expect(repository.rollback).toHaveBeenCalledWith("store-a", 1);
  });

  it("public theme lookup exposes only a repository-approved active published theme", async () => {
    repository.findPublicPublishedBySlug
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(theme("published", 2));
    await expect(
      service.getPublicPublishedTheme("inactive-store"),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.getPublicPublishedTheme("active-store"),
    ).resolves.toMatchObject({ publishedVersion: 2 });
  });
});
