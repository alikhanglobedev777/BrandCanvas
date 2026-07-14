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
import type {
  ProductImageListResponseDto,
  ProductImageMessageDto,
  ProductImageResponseDto,
  UpdateProductImageDto,
} from "../dto";
import { ProductImageMapper } from "../mappers";
import { ProductImageRepository } from "../repositories";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export interface UploadedProductImageInput {
  originalFilename: string;
  declaredMimeType: string;
  content: Buffer;
}

@Injectable()
export class ProductImageService {
  private readonly logger = new Logger(ProductImageService.name);
  private readonly maxBytes: number;

  constructor(
    private readonly repository: ProductImageRepository,
    private readonly storage: StoreAssetStorage,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.maxBytes = config.get("STORE_ASSET_MAX_BYTES", { infer: true });
  }

  async list(
    storeId: string,
    productId: string,
  ): Promise<ProductImageListResponseDto> {
    await this.requireProduct(storeId, productId);
    return {
      items: (await this.repository.list(storeId, productId)).map(
        ProductImageMapper.toResponse,
      ),
    };
  }

  async get(
    storeId: string,
    productId: string,
    imageId: string,
  ): Promise<ProductImageResponseDto> {
    const image = await this.repository.find(storeId, productId, imageId);
    if (!image) this.notFound();
    return ProductImageMapper.toResponse(image);
  }

  async upload(
    storeId: string,
    productId: string,
    input: UploadedProductImageInput,
  ): Promise<ProductImageResponseDto> {
    await this.requireProduct(storeId, productId);
    this.validateDeclaredUpload(input);
    const processed = await this.processImage(input);
    const stored = await this.storage.save({
      storeId,
      category: "products",
      extension: "webp",
      content: processed.content,
      mimeType: "image/webp",
      width: processed.width,
      height: processed.height,
      originalFilename: this.safeFilename(input.originalFilename),
    });
    try {
      const image = await this.repository.create({
        storeId,
        productId,
        variantId: null,
        storageProvider: stored.storageProvider,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl,
        originalFilename: stored.originalFilename,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        width: stored.width,
        height: stored.height,
        altText: null,
      });
      return ProductImageMapper.toResponse(image);
    } catch (error) {
      await this.removeQuietly(stored.storageKey);
      throw error;
    }
  }

  async update(
    storeId: string,
    productId: string,
    imageId: string,
    input: UpdateProductImageDto,
  ): Promise<ProductImageResponseDto> {
    if (
      input.variantId &&
      !(await this.repository.variantExists(
        storeId,
        productId,
        input.variantId,
      ))
    )
      throw new BadRequestException({
        code: "VARIANT_NOT_FOUND",
        message: "The selected variant does not belong to this product.",
      });
    const image = await this.repository.update(storeId, productId, imageId, {
      ...(input.altText !== undefined
        ? { altText: input.altText?.trim() || null }
        : {}),
      ...(input.variantId !== undefined ? { variantId: input.variantId } : {}),
    });
    if (!image) this.notFound();
    return ProductImageMapper.toResponse(image);
  }

  async reorder(storeId: string, productId: string, imageIds: string[]) {
    const images = await this.repository.reorder(storeId, productId, imageIds);
    if (images === "invalid_order")
      throw new BadRequestException({
        code: "PRODUCT_IMAGE_ORDER_INVALID",
        message: "Image order must contain every product image exactly once.",
      });
    if (!images)
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      });
    return { items: images.map(ProductImageMapper.toResponse) };
  }

  async setPrimary(storeId: string, productId: string, imageId: string) {
    const images = await this.repository.setPrimary(
      storeId,
      productId,
      imageId,
    );
    if (!images) this.notFound();
    return { items: images.map(ProductImageMapper.toResponse) };
  }

  async delete(
    storeId: string,
    productId: string,
    imageId: string,
  ): Promise<ProductImageMessageDto> {
    const image = await this.repository.delete(storeId, productId, imageId);
    if (!image) this.notFound();
    await this.removeQuietly(image.storageKey);
    return { message: "Product image removed successfully." };
  }

  private async requireProduct(storeId: string, productId: string) {
    if (!(await this.repository.productExists(storeId, productId)))
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      });
  }

  private validateDeclaredUpload(input: UploadedProductImageInput) {
    if (!input.content.byteLength)
      throw new BadRequestException({
        code: "INVALID_IMAGE",
        message: "Choose an image to upload.",
      });
    if (input.content.byteLength > this.maxBytes)
      throw new BadRequestException({
        code: "IMAGE_TOO_LARGE",
        message: `The image must be ${this.maxBytes} bytes or smaller.`,
      });
    const extension = path.extname(input.originalFilename).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(extension))
      throw new BadRequestException({
        code: "INVALID_IMAGE",
        message: "Upload a JPEG, PNG, or WebP image.",
      });
    if (
      !ALLOWED_TYPES.includes(
        input.declaredMimeType.toLowerCase() as (typeof ALLOWED_TYPES)[number],
      )
    )
      throw new BadRequestException({
        code: "INVALID_IMAGE",
        message: "Upload a JPEG, PNG, or WebP image.",
      });
  }

  private async processImage(input: UploadedProductImageInput) {
    try {
      const image = sharp(input.content, {
        failOn: "error",
        limitInputPixels: 40_000_000,
      }).rotate();
      const metadata = await image.metadata();
      if (
        !metadata.format ||
        !["jpeg", "png", "webp"].includes(metadata.format)
      )
        throw new Error("Unsupported image format.");
      if ((metadata.pages ?? 1) > 1)
        throw new Error("Animated images are unsupported.");
      if (!metadata.width || !metadata.height)
        throw new Error("Missing dimensions.");
      if (metadata.width > 8_000 || metadata.height > 8_000)
        throw new Error("Image dimensions are too large.");
      const decodedType =
        metadata.format === "jpeg" ? "image/jpeg" : `image/${metadata.format}`;
      if (decodedType !== input.declaredMimeType.toLowerCase())
        throw new Error("Declared image type does not match content.");
      const result = await image
        .resize(1_600, 1_600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 88 })
        .toBuffer({ resolveWithObject: true });
      if (!result.info.width || !result.info.height)
        throw new Error("Processed dimensions are missing.");
      return {
        content: result.data,
        width: result.info.width,
        height: result.info.height,
      };
    } catch {
      throw new BadRequestException({
        code: "INVALID_IMAGE",
        message: "The uploaded file is not a valid supported image.",
      });
    }
  }

  private safeFilename(filename: string) {
    const safe = path
      .basename(filename || "product-image")
      .normalize("NFKC")
      .replace(/[^A-Za-z0-9._ -]/g, "_")
      .replace(/\s+/g, " ")
      .trim();
    return (safe || "product-image").slice(0, 255);
  }

  private async removeQuietly(storageKey: string) {
    try {
      await this.storage.remove(storageKey);
    } catch (error) {
      this.logger.warn(
        `Unable to remove product image ${storageKey}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  private notFound(): never {
    throw new NotFoundException({
      code: "PRODUCT_IMAGE_NOT_FOUND",
      message: "Product image not found.",
    });
  }
}
