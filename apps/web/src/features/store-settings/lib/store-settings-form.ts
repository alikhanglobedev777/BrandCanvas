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
    socialLinks: {
      facebookUrl: settings.socialLinks.facebookUrl ?? "",
      instagramUrl: settings.socialLinks.instagramUrl ?? "",
      youtubeUrl: settings.socialLinks.youtubeUrl ?? "",
      tiktokUrl: settings.socialLinks.tiktokUrl ?? "",
      xUrl: settings.socialLinks.xUrl ?? "",
    },
    businessAddress: "",
    storePolicies: "",
    defaultCurrency: "",
  };
}

export function createEmptyStoreSettingsFormValues(): StoreSettingsFormValues {
  return {
    displayName: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    socialLinks: {
      facebookUrl: "",
      instagramUrl: "",
      youtubeUrl: "",
      tiktokUrl: "",
      xUrl: "",
    },
    businessAddress: "",
    storePolicies: "",
    defaultCurrency: "",
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
  };
}
