import type {
  StoreAssetEntity,
  StoreSettingsEntity,
  StoreThemeEntity,
} from "../entities";
import {
  StoreAssetResponseDto,
  StoreSettingsResponseDto,
  StoreThemeResponseDto,
} from "../dto";

export class StoreCustomizationMapper {
  static settingsToResponse(
    entity: StoreSettingsEntity,
  ): StoreSettingsResponseDto {
    return {
      id: entity.id,
      storeId: entity.storeId,
      displayName: entity.displayName,
      description: entity.description,
      contactEmail: entity.contactEmail,
      contactPhone: entity.contactPhone,
      socialLinks: {
        facebookUrl: entity.facebookUrl,
        instagramUrl: entity.instagramUrl,
        youtubeUrl: entity.youtubeUrl,
        tiktokUrl: entity.tiktokUrl,
        xUrl: entity.xUrl,
      },
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static themeToResponse(entity: StoreThemeEntity): StoreThemeResponseDto {
    return {
      id: entity.id,
      storeId: entity.storeId,
      lifecycle: entity.lifecycle,
      revision: entity.revision,
      publishedVersion: entity.publishedVersion,
      colors: {
        primary: entity.primaryColor,
        secondary: entity.secondaryColor,
        background: entity.backgroundColor,
        text: entity.textColor,
      },
      typography: {
        headingFont: entity.headingFont,
        bodyFont: entity.bodyFont,
      },
      header: {
        layout: entity.headerLayout,
        sticky: entity.headerSticky,
        showLogo: entity.headerShowLogo,
      },
      footer: {
        showContact: entity.footerShowContact,
        text: entity.footerText,
      },
      publishedAt: entity.publishedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static assetToResponse(entity: StoreAssetEntity): StoreAssetResponseDto {
    return {
      id: entity.id,
      storeId: entity.storeId,
      category: entity.category,
      storageProvider: entity.storageProvider,
      publicUrl: entity.publicUrl,
      originalFilename: entity.originalFilename,
      mimeType: entity.mimeType,
      sizeBytes: entity.sizeBytes,
      width: entity.width,
      height: entity.height,
      isCurrent: entity.isCurrent,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
