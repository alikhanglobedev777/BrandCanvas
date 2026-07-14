import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import {
  CreateProductDto,
  ProductListResponseDto,
  ProductQueryDto,
  ProductResponseDto,
} from "../dto";
import { ProductMapper } from "../mappers";
import { CatalogRepository } from "../repositories";

@Injectable()
export class CatalogService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  async findMany(
    storeId: string,
    query: ProductQueryDto,
  ): Promise<ProductListResponseDto> {
    const result = await this.catalogRepository.findMany({
      storeId,
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search ? { search: query.search } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.stockStatus ? { stockStatus: query.stockStatus } : {}),
    });

    return {
      items: result.items.map(ProductMapper.toResponse),
      page: query.page,
      pageSize: query.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / query.pageSize),
    };
  }

  async create(
    storeId: string,
    userId: string,
    input: CreateProductDto,
  ): Promise<ProductResponseDto> {
    if (
      input.compareAtPriceMinor !== null &&
      input.compareAtPriceMinor !== undefined &&
      input.compareAtPriceMinor < input.priceMinor
    ) {
      throw new BadRequestException({
        code: "PRODUCT_PRICE_RELATION_INVALID",
        message: "Compare-at price must not be lower than the selling price.",
      });
    }
    try {
      const product = await this.catalogRepository.create({
        storeId,
        createdBy: userId,
        name: input.name.trim(),
        slug: this.toSlug(input.name),
        ...(input.description?.trim()
          ? { description: input.description.trim() }
          : {}),
        status: input.status,
        sku: input.sku.trim().toUpperCase(),
        priceMinor: input.priceMinor,
        compareAtPriceMinor: input.compareAtPriceMinor ?? null,
        initialStock: input.initialStock,
        lowStockThreshold: input.lowStockThreshold,
      });
      return ProductMapper.toResponse(product);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: "PRODUCT_SLUG_OR_SKU_CONFLICT",
          message: "The product slug or SKU is already used in this store.",
        });
      }
      throw error;
    }
  }

  private toSlug(value: string): string {
    const base = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 150);
    return base || "product";
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
