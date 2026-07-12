export type StoreCustomizationMemberRole =
  | "owner"
  | "admin"
  | "catalog_manager"
  | "inventory_manager"
  | "order_manager"
  | "support_agent";

export type StoreCustomizationStoreStatus =
  "pending" | "active" | "inactive" | "suspended" | "archived";
export type StoreThemeLifecycle = "draft" | "published" | "archived";
export type StoreThemeFont =
  "system_sans" | "system_serif" | "georgia" | "arial" | "verdana";
export type StoreThemeHeaderLayout = "logo_left" | "logo_centered";
export type StoreThemeHeaderStyle = "solid" | "minimal";
export type StoreThemeFooterStyle = "simple" | "columns";
export type StoreThemeProductCardStyle = "minimal" | "bordered" | "elevated";

export interface StoreCustomizationAccessEntity {
  storeId: string;
  status: StoreCustomizationStoreStatus;
  memberRole: StoreCustomizationMemberRole;
}

export interface StoreSettingsEntity {
  id: string;
  storeId: string;
  displayName: string;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  xUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreThemeEntity {
  id: string;
  storeId: string;
  lifecycle: StoreThemeLifecycle;
  revision: number;
  publishedVersion: number | null;
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
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreAssetEntity {
  id: string;
  storeId: string;
  category: string;
  storageProvider: string;
  storageKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}
