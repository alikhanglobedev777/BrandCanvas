import type {
  SaveThemeDraftDto,
  StoreSettingsResponseDto,
  StoreThemeResponseDto,
  UpdateStoreSettingsDto,
} from "@brandcanvas/contracts";
import {
  defaultStoreBrandingValues,
  type StoreBrandingFormValues,
} from "../model/store-branding-options";
import type { StoreSettingsFormValues } from "../model/store-settings-form-values";

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function createStoreSettingsFormValues(
  settings: StoreSettingsResponseDto,
): StoreSettingsFormValues {
  return {
    displayName: settings.displayName,
    description: settings.description ?? "",
    contactEmail: settings.contactEmail ?? "",
    contactPhone: settings.contactPhone ?? "",
    businessAddress: settings.businessAddress ?? "",
    storePolicies: settings.storePolicies ?? "",
    defaultCurrency: settings.defaultCurrency,
    socialLinks: {
      facebookUrl: settings.socialLinks.facebookUrl ?? "",
      instagramUrl: settings.socialLinks.instagramUrl ?? "",
      youtubeUrl: settings.socialLinks.youtubeUrl ?? "",
      tiktokUrl: settings.socialLinks.tiktokUrl ?? "",
      xUrl: settings.socialLinks.xUrl ?? "",
    },
  };
}

export function createEmptyStoreSettingsFormValues(): StoreSettingsFormValues {
  return {
    displayName: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    businessAddress: "",
    storePolicies: "",
    defaultCurrency: "PKR",
    socialLinks: {
      facebookUrl: "",
      instagramUrl: "",
      youtubeUrl: "",
      tiktokUrl: "",
      xUrl: "",
    },
  };
}

export function toStoreSettingsRequest(
  values: StoreSettingsFormValues,
): UpdateStoreSettingsDto {
  return {
    displayName: values.displayName.trim(),
    description: trimToNull(values.description),
    contactEmail: trimToNull(values.contactEmail),
    contactPhone: trimToNull(values.contactPhone),
    businessAddress: trimToNull(values.businessAddress),
    storePolicies: trimToNull(values.storePolicies),
    defaultCurrency: values.defaultCurrency,
    socialLinks: {
      facebookUrl: trimToNull(values.socialLinks.facebookUrl),
      instagramUrl: trimToNull(values.socialLinks.instagramUrl),
      youtubeUrl: trimToNull(values.socialLinks.youtubeUrl),
      tiktokUrl: trimToNull(values.socialLinks.tiktokUrl),
      xUrl: trimToNull(values.socialLinks.xUrl),
    },
  };
}

export function createStoreBrandingFormValues(
  theme?: SaveThemeDraftDto | StoreThemeResponseDto | null,
): StoreBrandingFormValues {
  const source = theme ?? defaultStoreBrandingValues;
  return {
    colors: { ...source.colors },
    typography: { ...source.typography },
    header: { ...source.header },
    footer: {
      ...source.footer,
      text: source.footer.text ?? "",
    },
    buttonRadius: source.buttonRadius,
    cardRadius: source.cardRadius,
    productCardStyle: source.productCardStyle,
  };
}

export function toSaveThemeDraftRequest(
  values: StoreBrandingFormValues,
  expectedRevision: number,
): SaveThemeDraftDto {
  return {
    ...values,
    expectedRevision,
    footer: {
      ...values.footer,
      text: trimToNull(values.footer.text),
    },
  };
}
