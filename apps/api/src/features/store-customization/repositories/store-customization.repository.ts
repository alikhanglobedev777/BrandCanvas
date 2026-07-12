import type {
  StoreAssetEntity,
  StoreCustomizationAccessEntity,
  StoreSettingsEntity,
  StoreThemeEntity,
  StoreThemeFont,
  StoreThemeHeaderLayout,
} from "../entities";

export interface UpdateSettingsPersistenceInput {
  displayName?: string;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  xUrl?: string | null;
}

export interface ThemePersistenceInput {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: StoreThemeFont;
  bodyFont: StoreThemeFont;
  headerLayout: StoreThemeHeaderLayout;
  headerSticky: boolean;
  headerShowLogo: boolean;
  footerShowContact: boolean;
  footerText: string | null;
}

export interface UpsertAssetPersistenceInput {
  id?: string;
  storeId: string;
  category: string;
  storageProvider: string;
  storageKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  isCurrent: boolean;
}

export type RemoveAssetResult = "removed" | "not_found" | "in_use";

export abstract class StoreCustomizationRepository {
  abstract findSellerAccess(
    userId: string,
    storeId: string,
  ): Promise<StoreCustomizationAccessEntity | null>;
  abstract findSettings(storeId: string): Promise<StoreSettingsEntity | null>;
  abstract updateSettings(
    storeId: string,
    input: UpdateSettingsPersistenceInput,
  ): Promise<StoreSettingsEntity | null>;
  abstract findDraft(storeId: string): Promise<StoreThemeEntity | null>;
  abstract findPublished(storeId: string): Promise<StoreThemeEntity | null>;
  abstract findPublicPublishedBySlug(
    slug: string,
  ): Promise<StoreThemeEntity | null>;
  abstract saveDraft(
    storeId: string,
    input: ThemePersistenceInput,
  ): Promise<StoreThemeEntity | null>;
  abstract publishDraft(storeId: string): Promise<StoreThemeEntity | null>;
  abstract listPublishedVersions(storeId: string): Promise<StoreThemeEntity[]>;
  abstract rollback(
    storeId: string,
    version: number,
  ): Promise<StoreThemeEntity | null>;
  abstract upsertAsset(
    input: UpsertAssetPersistenceInput,
  ): Promise<StoreAssetEntity | null>;
  abstract removeUnusedAsset(
    storeId: string,
    assetId: string,
  ): Promise<RemoveAssetResult>;
}
