export interface StoreSettingsFormValues {
  displayName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  socialLinks: {
    facebookUrl: string;
    instagramUrl: string;
    youtubeUrl: string;
    tiktokUrl: string;
    xUrl: string;
  };
  businessAddress: string;
  storePolicies: string;
  defaultCurrency: string;
}

export type StoreSettingsFieldPath =
  | "displayName"
  | "description"
  | "contactEmail"
  | "contactPhone"
  | "businessAddress"
  | "storePolicies"
  | "defaultCurrency"
  | "socialLinks.facebookUrl"
  | "socialLinks.instagramUrl"
  | "socialLinks.youtubeUrl"
  | "socialLinks.tiktokUrl"
  | "socialLinks.xUrl";

export const STORE_SETTINGS_FIELD_PATHS: Record<StoreSettingsFieldPath, true> =
  {
    displayName: true,
    description: true,
    contactEmail: true,
    contactPhone: true,
    businessAddress: true,
    storePolicies: true,
    defaultCurrency: true,
    "socialLinks.facebookUrl": true,
    "socialLinks.instagramUrl": true,
    "socialLinks.youtubeUrl": true,
    "socialLinks.tiktokUrl": true,
    "socialLinks.xUrl": true,
  };
