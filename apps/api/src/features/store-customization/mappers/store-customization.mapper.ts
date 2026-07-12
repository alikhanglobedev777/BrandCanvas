import type {
  StoreAssetEntity,
  StoreSettingsEntity,
  StoreThemeEntity,
} from "../entities";
import {
  StoreAssetResponseDto,
  type StoreAssetCategoryValue,
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
      businessAddress: entity.businessAddress,
      storePolicies: entity.storePolicies,
      defaultCurrency: entity.defaultCurrency,
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
        style: entity.headerStyle,
        sticky: entity.headerSticky,
        showLogo: entity.headerShowLogo,
      },
      footer: {
        style: entity.footerStyle,
        showContact: entity.footerShowContact,
        text: entity.footerText,
      },
      buttonRadius: entity.buttonRadius,
      cardRadius: entity.cardRadius,
      productCardStyle: entity.productCardStyle,
      publishedAt: entity.publishedAt?.toISOString() ?? null,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static assetToResponse(entity: StoreAssetEntity): StoreAssetResponseDto {
    return {
      id: entity.id,
      storeId: entity.storeId,
      category: entity.category as StoreAssetCategoryValue,
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
