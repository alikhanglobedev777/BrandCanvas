import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  RegisterStoreAssetDto,
  SaveThemeDraftDto,
  StoreAssetResponseDto,
  StoreCustomizationMessageDto,
  StoreSettingsResponseDto,
  StoreThemeResponseDto,
  ThemeVersionListResponseDto,
  UpdateStoreSettingsDto,
} from "../dto";
import { StoreCustomizationMapper } from "../mappers";
import {
  StoreCustomizationRepository,
  type ThemePersistenceInput,
  type UpdateSettingsPersistenceInput,
} from "../repositories";

@Injectable()
export class StoreCustomizationService {
  constructor(private readonly repository: StoreCustomizationRepository) {}

  async getSettings(storeId: string): Promise<StoreSettingsResponseDto> {
    const settings = await this.repository.findSettings(storeId);
    if (!settings)
      this.notFound(
        "STORE_SETTINGS_NOT_FOUND",
        "Store settings were not found.",
      );
    return StoreCustomizationMapper.settingsToResponse(settings);
  }

  async updateSettings(
    storeId: string,
    input: UpdateStoreSettingsDto,
  ): Promise<StoreSettingsResponseDto> {
    const update: UpdateSettingsPersistenceInput = {};
    if (input.displayName !== undefined)
      update.displayName = input.displayName.trim();
    if (input.description !== undefined)
      update.description = this.nullableText(input.description);
    if (input.contactEmail !== undefined)
      update.contactEmail =
        this.nullableText(input.contactEmail)?.toLowerCase() ?? null;
    if (input.contactPhone !== undefined)
      update.contactPhone = this.nullableText(input.contactPhone);
    if (input.socialLinks) {
      const social = input.socialLinks;
      if (social.facebookUrl !== undefined)
        update.facebookUrl = this.nullableText(social.facebookUrl);
      if (social.instagramUrl !== undefined)
        update.instagramUrl = this.nullableText(social.instagramUrl);
      if (social.youtubeUrl !== undefined)
        update.youtubeUrl = this.nullableText(social.youtubeUrl);
      if (social.tiktokUrl !== undefined)
        update.tiktokUrl = this.nullableText(social.tiktokUrl);
      if (social.xUrl !== undefined)
        update.xUrl = this.nullableText(social.xUrl);
    }
    if (!Object.keys(update).length) {
      throw new BadRequestException({
        code: "SETTINGS_UPDATE_EMPTY",
        message: "At least one settings field is required.",
      });
    }

    const settings = await this.repository.updateSettings(storeId, update);
    if (!settings)
      this.notFound(
        "STORE_SETTINGS_NOT_FOUND",
        "Store settings were not found.",
      );
    return StoreCustomizationMapper.settingsToResponse(settings);
  }

  async getDraft(storeId: string): Promise<StoreThemeResponseDto> {
    const draft = await this.repository.findDraft(storeId);
    if (!draft)
      this.notFound("THEME_DRAFT_NOT_FOUND", "The theme draft was not found.");
    return StoreCustomizationMapper.themeToResponse(draft);
  }

  getPreview(storeId: string): Promise<StoreThemeResponseDto> {
    return this.getDraft(storeId);
  }

  async saveDraft(
    storeId: string,
    input: SaveThemeDraftDto,
  ): Promise<StoreThemeResponseDto> {
    const draft = await this.repository.saveDraft(
      storeId,
      this.toThemeInput(input),
    );
    if (!draft)
      this.notFound("THEME_DRAFT_NOT_FOUND", "The theme draft was not found.");
    return StoreCustomizationMapper.themeToResponse(draft);
  }

  async publish(storeId: string): Promise<StoreThemeResponseDto> {
    const published = await this.repository.publishDraft(storeId);
    if (!published)
      this.notFound("THEME_DRAFT_NOT_FOUND", "The theme draft was not found.");
    return StoreCustomizationMapper.themeToResponse(published);
  }

  async listVersions(storeId: string): Promise<ThemeVersionListResponseDto> {
    const versions = await this.repository.listPublishedVersions(storeId);
    return { items: versions.map(StoreCustomizationMapper.themeToResponse) };
  }

  async rollback(
    storeId: string,
    version: number,
  ): Promise<StoreThemeResponseDto> {
    const published = await this.repository.rollback(storeId, version);
    if (!published) {
      this.notFound(
        "THEME_VERSION_NOT_FOUND",
        "The selected previous theme version was not found.",
      );
    }
    return StoreCustomizationMapper.themeToResponse(published);
  }

  async getPublicPublishedTheme(slug: string): Promise<StoreThemeResponseDto> {
    const published = await this.repository.findPublicPublishedBySlug(slug);
    if (!published)
      this.notFound(
        "PUBLISHED_THEME_NOT_FOUND",
        "No published theme is available for this store.",
      );
    return StoreCustomizationMapper.themeToResponse(published);
  }

  async upsertAsset(
    storeId: string,
    input: RegisterStoreAssetDto,
  ): Promise<StoreAssetResponseDto> {
    this.assertAssetMetadata(input);
    try {
      const asset = await this.repository.upsertAsset({
        ...(input.id ? { id: input.id } : {}),
        storeId,
        category: input.category,
        storageProvider: input.storageProvider.trim(),
        storageKey: input.storageKey.trim(),
        publicUrl: input.publicUrl,
        originalFilename: input.originalFilename.trim(),
        mimeType: input.mimeType.toLowerCase(),
        sizeBytes: input.sizeBytes,
        ...(input.width ? { width: input.width } : {}),
        ...(input.height ? { height: input.height } : {}),
        isCurrent: input.isCurrent,
      });
      if (!asset)
        this.notFound(
          "STORE_ASSET_NOT_FOUND",
          "The store asset was not found.",
        );
      return StoreCustomizationMapper.assetToResponse(asset);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: "STORE_ASSET_CONFLICT",
          message: "This stored asset is already registered.",
        });
      }
      throw error;
    }
  }

  async removeAsset(
    storeId: string,
    assetId: string,
  ): Promise<StoreCustomizationMessageDto> {
    const result = await this.repository.removeUnusedAsset(storeId, assetId);
    if (result === "not_found")
      this.notFound("STORE_ASSET_NOT_FOUND", "The store asset was not found.");
    if (result === "in_use") {
      throw new ConflictException({
        code: "STORE_ASSET_IN_USE",
        message:
          "The current asset must be replaced or unassigned before it can be removed.",
      });
    }
    return { message: "Store asset metadata removed successfully." };
  }

  private toThemeInput(input: SaveThemeDraftDto): ThemePersistenceInput {
    return {
      primaryColor: input.colors.primary.toUpperCase(),
      secondaryColor: input.colors.secondary.toUpperCase(),
      backgroundColor: input.colors.background.toUpperCase(),
      textColor: input.colors.text.toUpperCase(),
      headingFont: input.typography.headingFont,
      bodyFont: input.typography.bodyFont,
      headerLayout: input.header.layout,
      headerSticky: input.header.sticky,
      headerShowLogo: input.header.showLogo,
      footerShowContact: input.footer.showContact,
      footerText: this.nullableText(input.footer.text),
    };
  }

  private assertAssetMetadata(input: RegisterStoreAssetDto): void {
    if (!input.mimeType.toLowerCase().startsWith("image/")) {
      throw new BadRequestException({
        code: "STORE_ASSET_TYPE_UNSUPPORTED",
        message: "Store assets must be images.",
      });
    }
    const key = input.storageKey.trim();
    if (
      !/^[A-Za-z0-9][A-Za-z0-9/_.-]{0,999}$/.test(key) ||
      key.includes("..") ||
      key.includes("//")
    ) {
      throw new BadRequestException({
        code: "STORE_ASSET_KEY_INVALID",
        message: "The storage key is invalid.",
      });
    }
  }

  private nullableText(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = value.trim();
    return trimmed || null;
  }

  private notFound(code: string, message: string): never {
    throw new NotFoundException({ code, message });
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505"
    );
  }
}
