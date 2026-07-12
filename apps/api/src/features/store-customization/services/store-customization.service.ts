import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  PublishThemeDto,
  SaveThemeDraftDto,
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
    if (input.businessAddress !== undefined)
      update.businessAddress = this.nullableText(input.businessAddress);
    if (input.storePolicies !== undefined)
      update.storePolicies = this.nullableText(input.storePolicies);
    if (input.defaultCurrency !== undefined)
      update.defaultCurrency = input.defaultCurrency.toUpperCase();
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
    const draft = await this.repository.saveDraft(storeId, {
      ...this.toThemeInput(input),
      expectedRevision: input.expectedRevision,
    });
    if (draft === "revision_conflict") {
      this.revisionConflict();
    }
    if (!draft)
      this.notFound("THEME_DRAFT_NOT_FOUND", "The theme draft was not found.");
    return StoreCustomizationMapper.themeToResponse(draft);
  }

  async publish(
    storeId: string,
    input: PublishThemeDto,
  ): Promise<StoreThemeResponseDto> {
    const published = await this.repository.publishDraft(
      storeId,
      input.expectedRevision,
    );
    if (published === "revision_conflict") {
      this.revisionConflict();
    }
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

  private toThemeInput(input: SaveThemeDraftDto): ThemePersistenceInput {
    return {
      primaryColor: input.colors.primary.toUpperCase(),
      secondaryColor: input.colors.secondary.toUpperCase(),
      backgroundColor: input.colors.background.toUpperCase(),
      textColor: input.colors.text.toUpperCase(),
      headingFont: input.typography.headingFont,
      bodyFont: input.typography.bodyFont,
      headerLayout: input.header.layout,
      headerStyle: input.header.style,
      headerSticky: input.header.sticky,
      headerShowLogo: input.header.showLogo,
      buttonRadius: input.buttonRadius,
      cardRadius: input.cardRadius,
      productCardStyle: input.productCardStyle,
      footerStyle: input.footer.style,
      footerShowContact: input.footer.showContact,
      footerText: this.nullableText(input.footer.text),
    };
  }

  private revisionConflict(): never {
    throw new ConflictException({
      code: "THEME_REVISION_CONFLICT",
      message:
        "The theme draft changed after it was loaded. Reload the latest draft before saving or publishing.",
    });
  }

  private nullableText(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = value.trim();
    return trimmed || null;
  }

  private notFound(code: string, message: string): never {
    throw new NotFoundException({ code, message });
  }

}
