import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import path from "node:path";
import sharp from "sharp";
import type { AppEnvironment } from "../../../config/env.schema";
import { StoreAssetStorage } from "../../../infrastructure/storage";
import {
  STORE_ASSET_CATEGORIES,
  type StoreAssetCategoryValue,
  type StoreAssetListResponseDto,
  type StoreAssetResponseDto,
  type StoreCustomizationMessageDto,
} from "../dto";
import { StoreCustomizationMapper } from "../mappers";
import { StoreCustomizationRepository } from "../repositories";

const DECLARED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export interface UploadedStoreAssetInput {
  originalFilename: string;
  declaredMimeType: string;
  content: Buffer;
}

@Injectable()
export class StoreAssetService {
  private readonly logger = new Logger(StoreAssetService.name);
  private readonly maxBytes: number;

  constructor(
    private readonly repository: StoreCustomizationRepository,
    private readonly storage: StoreAssetStorage,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.maxBytes = config.get("STORE_ASSET_MAX_BYTES", { infer: true });
  }

  async list(storeId: string): Promise<StoreAssetListResponseDto> {
    const assets = await this.repository.listCurrentAssets(storeId);
    return { items: assets.map(StoreCustomizationMapper.assetToResponse) };
  }

  async upload(
    storeId: string,
    category: string,
    input: UploadedStoreAssetInput,
  ): Promise<StoreAssetResponseDto> {
    const safeCategory = this.parseCategory(category);
    this.validateDeclaredUpload(input);
    const processed = await this.processImage(
      safeCategory,
      input.content,
      input.declaredMimeType.toLowerCase(),
    );
    const originalFilename = this.safeOriginalFilename(input.originalFilename);

    const stored = await this.storage.save({
      storeId,
      category: safeCategory,
      extension: processed.extension,
      content: processed.content,
      mimeType: processed.mimeType,
      width: processed.width,
      height: processed.height,
      originalFilename,
    });

    try {
      const result = await this.repository.replaceCurrentAsset({
        storeId,
        category: safeCategory,
        storageProvider: stored.storageProvider,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl,
        originalFilename: stored.originalFilename,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        width: stored.width,
        height: stored.height,
      });

      if (result.replaced?.storageProvider === stored.storageProvider) {
        await this.removeStoredFileQuietly(result.replaced.storageKey);
      }

      return StoreCustomizationMapper.assetToResponse(result.asset);
    } catch (error) {
      await this.removeStoredFileQuietly(stored.storageKey);
      throw error;
    }
  }

  async remove(
    storeId: string,
    assetId: string,
  ): Promise<StoreCustomizationMessageDto> {
    const asset = await this.repository.deleteAsset(storeId, assetId);
    if (!asset) {
      throw new NotFoundException({
        code: "STORE_ASSET_NOT_FOUND",
        message: "The store asset was not found.",
      });
    }

    if (asset.storageProvider === "local") {
      await this.removeStoredFileQuietly(asset.storageKey);
    }

    return { message: "Store asset removed successfully." };
  }

  private parseCategory(category: string): StoreAssetCategoryValue {
    if (
      !STORE_ASSET_CATEGORIES.includes(category as StoreAssetCategoryValue)
    ) {
      throw new BadRequestException({
        code: "STORE_ASSET_CATEGORY_UNSUPPORTED",
        message: "Only logo and favicon assets are supported.",
      });
    }
    return category as StoreAssetCategoryValue;
  }

  private validateDeclaredUpload(input: UploadedStoreAssetInput): void {
    if (!input.content.byteLength) {
      throw new BadRequestException({
        code: "STORE_ASSET_FILE_REQUIRED",
        message: "Choose an image file to upload.",
      });
    }
    if (input.content.byteLength > this.maxBytes) {
      throw new BadRequestException({
        code: "STORE_ASSET_TOO_LARGE",
        message: `The image must be ${this.maxBytes} bytes or smaller.`,
      });
    }
    const extension = path.extname(input.originalFilename).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) {
      throw new BadRequestException({
        code: "STORE_ASSET_EXTENSION_UNSUPPORTED",
        message: "Use a .png, .jpg, .jpeg, or .webp image file.",
      });
    }
    if (
      !DECLARED_IMAGE_TYPES.includes(
        input.declaredMimeType.toLowerCase() as (typeof DECLARED_IMAGE_TYPES)[number],
      )
    ) {
      throw new BadRequestException({
        code: "STORE_ASSET_TYPE_UNSUPPORTED",
        message: "Upload a PNG, JPEG, or WebP image.",
      });
    }
  }

  private async processImage(
    category: StoreAssetCategoryValue,
    content: Buffer,
    declaredMimeType: string,
  ): Promise<{
    content: Buffer;
    extension: "png" | "webp";
    mimeType: "image/png" | "image/webp";
    width: number;
    height: number;
  }> {
    try {
      const image = sharp(content, {
        failOn: "error",
        limitInputPixels: 40_000_000,
      }).rotate();
      const metadata = await image.metadata();

      if (!metadata.format || !["png", "jpeg", "webp"].includes(metadata.format)) {
        throw new Error("Unsupported decoded image format.");
      }
      if ((metadata.pages ?? 1) > 1) {
        throw new Error("Animated images are not supported.");
      }

      const decodedMimeType =
        metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
      if (decodedMimeType !== declaredMimeType) {
        throw new Error("Declared and decoded image types do not match.");
      }

      const result =
        category === "favicon"
          ? await image
              .resize(64, 64, {
                fit: "contain",
                background: { r: 0, g: 0, b: 0, alpha: 0 },
              })
              .png({ compressionLevel: 9 })
              .toBuffer({ resolveWithObject: true })
          : await image
              .resize(1200, 1200, {
                fit: "inside",
                withoutEnlargement: true,
              })
              .webp({ quality: 88 })
              .toBuffer({ resolveWithObject: true });

      if (!result.info.width || !result.info.height) {
        throw new Error("Processed image dimensions are missing.");
      }

      return {
        content: result.data,
        extension: category === "favicon" ? "png" : "webp",
        mimeType: category === "favicon" ? "image/png" : "image/webp",
        width: result.info.width,
        height: result.info.height,
      };
    } catch {
      throw new BadRequestException({
        code: "STORE_ASSET_IMAGE_INVALID",
        message: "The uploaded file is not a valid supported image.",
      });
    }
  }

  private safeOriginalFilename(filename: string): string {
    const base = path
      .basename(filename || "store-image")
      .normalize("NFKC")
      .replace(/[^A-Za-z0-9._ -]/g, "_")
      .replace(/\s+/g, " ")
      .trim();
    return (base || "store-image").slice(0, 255);
  }

  private async removeStoredFileQuietly(storageKey: string): Promise<void> {
    try {
      await this.storage.remove(storageKey);
    } catch (error) {
      this.logger.warn(
        `Unable to remove local store asset ${storageKey}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }
}
