import { NotFoundException } from "@nestjs/common";
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
  upsertAsset = vi.fn<StoreCustomizationRepository["upsertAsset"]>();
  removeUnusedAsset =
    vi.fn<StoreCustomizationRepository["removeUnusedAsset"]>();
}

const now = new Date("2026-07-12T12:00:00.000Z");
const settings: StoreSettingsEntity = {
  id: "settings-a",
  storeId: "store-a",
  displayName: "Store A",
  description: null,
  contactEmail: null,
  contactPhone: null,
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
    headerSticky: true,
    headerShowLogo: true,
    footerShowContact: true,
    footerText: null,
    publishedAt: version === null ? null : now,
    createdAt: now,
    updatedAt: now,
  };
}

const draftInput = {
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
  header: { layout: "logo_left" as const, sticky: true, showLogo: true },
  footer: { showContact: true, text: null },
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
      service.updateSettings("store-a", { displayName: " Updated " }),
    ).resolves.toMatchObject({
      storeId: "store-a",
      displayName: "Updated",
    });
    expect(repository.updateSettings).toHaveBeenCalledWith("store-a", {
      displayName: "Updated",
    });
  });

  it("saving a draft does not alter the published theme", async () => {
    const published = theme("published", 1);
    repository.saveDraft.mockResolvedValue(theme("draft", null));
    repository.findPublished.mockResolvedValue(published);

    await service.saveDraft("store-a", draftInput);
    await expect(
      service.getPublicPublishedTheme("store-a"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.publishDraft).not.toHaveBeenCalled();
    expect(repository.findPublished).not.toHaveBeenCalled();
  });

  it("publishing creates and returns the next immutable version", async () => {
    repository.publishDraft.mockResolvedValue(theme("published", 2));
    await expect(service.publish("store-a")).resolves.toMatchObject({
      lifecycle: "published",
      publishedVersion: 2,
    });
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
    ).rejects.toMatchObject({
      response: { code: "PUBLISHED_THEME_NOT_FOUND" },
    });
    await expect(
      service.getPublicPublishedTheme("active-store"),
    ).resolves.toMatchObject({ publishedVersion: 2 });
  });
});
