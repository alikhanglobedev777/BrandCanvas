import type {
  StoreAssetEntity,
  StoreCustomizationAccessEntity,
  StoreSettingsEntity,
  StoreThemeEntity,
  StoreThemeFont,
  StoreThemeFooterStyle,
  StoreThemeHeaderLayout,
  StoreThemeHeaderStyle,
  StoreThemeProductCardStyle,
} from "../entities";

export interface UpdateSettingsPersistenceInput {
  displayName?: string;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  businessAddress?: string | null;
  storePolicies?: string | null;
  defaultCurrency?: string;
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
  headerStyle: StoreThemeHeaderStyle;
  headerSticky: boolean;
  headerShowLogo: boolean;
  buttonRadius: number;
  cardRadius: number;
  productCardStyle: StoreThemeProductCardStyle;
  footerStyle: StoreThemeFooterStyle;
  footerShowContact: boolean;
  footerText: string | null;
}

export interface SaveThemeDraftPersistenceInput extends ThemePersistenceInput {
  expectedRevision: number;
}

export interface CreateCurrentAssetPersistenceInput {
  storeId: string;
  category: "logo" | "favicon";
  storageProvider: string;
  storageKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

export interface ReplaceCurrentAssetResult {
  asset: StoreAssetEntity;
  replaced: StoreAssetEntity | null;
}

export type ThemeWriteResult = StoreThemeEntity | "revision_conflict" | null;

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
    input: SaveThemeDraftPersistenceInput,
  ): Promise<ThemeWriteResult>;
  abstract publishDraft(
    storeId: string,
    expectedRevision: number,
  ): Promise<ThemeWriteResult>;
  abstract listPublishedVersions(storeId: string): Promise<StoreThemeEntity[]>;
  abstract rollback(
    storeId: string,
    version: number,
  ): Promise<StoreThemeEntity | null>;
  abstract listCurrentAssets(storeId: string): Promise<StoreAssetEntity[]>;
  abstract replaceCurrentAsset(
    input: CreateCurrentAssetPersistenceInput,
  ): Promise<ReplaceCurrentAssetResult>;
  abstract deleteAsset(
    storeId: string,
    assetId: string,
  ): Promise<StoreAssetEntity | null>;
}
