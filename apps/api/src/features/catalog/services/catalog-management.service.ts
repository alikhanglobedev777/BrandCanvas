import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CatalogMessageDto,
  CategoryListResponseDto,
  CategoryQueryDto,
  CategoryResponseDto,
  CollectionListResponseDto,
  CollectionQueryDto,
  CollectionResponseDto,
  CreateCategoryDto,
  CreateCollectionDto,
  CreateProductOptionDto,
  CreateProductOptionValueDto,
  CreateProductVariantDto,
  ProductDetailsResponseDto,
  UpdateCategoryDto,
  UpdateCollectionDto,
  UpdateProductDto,
  UpdateProductOptionDto,
  UpdateProductOptionValueDto,
  UpdateProductVariantDto,
} from "../dto";
import { CatalogManagementMapper } from "../mappers";
import type { ProductDetailsEntity } from "../entities";
import {
  CatalogManagementRepository,
  type ProductWrite,
  type VariantWrite,
} from "../repositories/catalog-management.repository";

@Injectable()
export class CatalogManagementService {
  constructor(private readonly repository: CatalogManagementRepository) {}

  async listCategories(
    storeId: string,
    query: CategoryQueryDto,
  ): Promise<CategoryListResponseDto> {
    const result = await this.repository.listCategories({
      storeId,
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search ? { search: query.search } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.archived !== undefined ? { archived: query.archived } : {}),
    });
    return {
      items: result.items.map(CatalogManagementMapper.category),
      page: query.page,
      pageSize: query.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / query.pageSize),
    };
  }
  async getCategory(storeId: string, id: string): Promise<CategoryResponseDto> {
    return CatalogManagementMapper.category(
      await this.requireCategory(storeId, id),
    );
  }
  async createCategory(
    storeId: string,
    input: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    if (
      input.imageAssetId &&
      !(await this.repository.storeAssetExists(storeId, input.imageAssetId))
    )
      this.bad(
        "CATEGORY_IMAGE_ASSET_INVALID",
        "The category image asset does not belong to this store.",
      );
    try {
      return CatalogManagementMapper.category(
        await this.repository.createCategory(storeId, {
          name: input.name.trim(),
          slug: this.slug(input.slug ?? input.name),
          description: this.nullable(input.description),
          imageAssetId: input.imageAssetId ?? null,
          sortOrder: input.sortOrder ?? 0,
          status: input.status ?? "active",
        }),
      );
    } catch (error) {
      this.rethrowUnique(
        error,
        "CATEGORY_SLUG_CONFLICT",
        "This category slug is already used in this store.",
      );
    }
  }
  async updateCategory(
    storeId: string,
    id: string,
    input: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    if (
      input.imageAssetId &&
      !(await this.repository.storeAssetExists(storeId, input.imageAssetId))
    )
      this.bad(
        "CATEGORY_IMAGE_ASSET_INVALID",
        "The category image asset does not belong to this store.",
      );
    const values = {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined ? { slug: this.slug(input.slug) } : {}),
      ...(input.description !== undefined
        ? { description: this.nullable(input.description) }
        : {}),
      ...(input.imageAssetId !== undefined
        ? { imageAssetId: input.imageAssetId }
        : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    };
    try {
      const row = await this.repository.updateCategory(storeId, id, values);
      if (!row) this.notFound("CATEGORY_NOT_FOUND", "Category not found.");
      return CatalogManagementMapper.category(row);
    } catch (error) {
      this.rethrowUnique(
        error,
        "CATEGORY_SLUG_CONFLICT",
        "This category slug is already used in this store.",
      );
    }
  }
  archiveCategory(storeId: string, id: string) {
    return this.categoryArchive(storeId, id, true);
  }
  restoreCategory(storeId: string, id: string) {
    return this.categoryArchive(storeId, id, false);
  }

  async listCollections(
    storeId: string,
    query: CollectionQueryDto,
  ): Promise<CollectionListResponseDto> {
    const result = await this.repository.listCollections({
      storeId,
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search ? { search: query.search } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.archived !== undefined ? { archived: query.archived } : {}),
    });
    return {
      items: result.items.map(CatalogManagementMapper.collection),
      page: query.page,
      pageSize: query.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / query.pageSize),
    };
  }
  async getCollection(
    storeId: string,
    id: string,
  ): Promise<CollectionResponseDto> {
    return CatalogManagementMapper.collection(
      await this.requireCollection(storeId, id),
    );
  }
  async createCollection(
    storeId: string,
    input: CreateCollectionDto,
  ): Promise<CollectionResponseDto> {
    try {
      return CatalogManagementMapper.collection(
        await this.repository.createCollection(storeId, {
          title: input.title.trim(),
          slug: this.slug(input.slug ?? input.title),
          description: this.nullable(input.description),
          status: input.status ?? "draft",
          sortOrder: input.sortOrder ?? 0,
        }),
      );
    } catch (error) {
      this.rethrowUnique(
        error,
        "COLLECTION_SLUG_CONFLICT",
        "This collection slug is already used in this store.",
      );
    }
  }
  async updateCollection(
    storeId: string,
    id: string,
    input: UpdateCollectionDto,
  ): Promise<CollectionResponseDto> {
    const values = {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.slug !== undefined ? { slug: this.slug(input.slug) } : {}),
      ...(input.description !== undefined
        ? { description: this.nullable(input.description) }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    };
    try {
      const row = await this.repository.updateCollection(storeId, id, values);
      if (!row) this.notFound("COLLECTION_NOT_FOUND", "Collection not found.");
      return CatalogManagementMapper.collection(row);
    } catch (error) {
      this.rethrowUnique(
        error,
        "COLLECTION_SLUG_CONFLICT",
        "This collection slug is already used in this store.",
      );
    }
  }
  archiveCollection(storeId: string, id: string) {
    return this.collectionArchive(storeId, id, true);
  }
  restoreCollection(storeId: string, id: string) {
    return this.collectionArchive(storeId, id, false);
  }
  async addCollectionProducts(
    storeId: string,
    id: string,
    productIds: string[],
  ) {
    const result = await this.repository.addCollectionProducts(
      storeId,
      id,
      productIds,
    );
    if (result === "invalid_products")
      this.bad(
        "COLLECTION_PRODUCTS_INVALID",
        "One or more products do not belong to this store.",
      );
    if (!result) this.notFound("COLLECTION_NOT_FOUND", "Collection not found.");
    return CatalogManagementMapper.collection(result);
  }
  async removeCollectionProducts(
    storeId: string,
    id: string,
    productIds: string[],
  ) {
    const result = await this.repository.removeCollectionProducts(
      storeId,
      id,
      productIds,
    );
    if (!result) this.notFound("COLLECTION_NOT_FOUND", "Collection not found.");
    return CatalogManagementMapper.collection(result);
  }
  async reorderCollectionProducts(
    storeId: string,
    id: string,
    productIds: string[],
  ) {
    if (productIds.length !== new Set(productIds).size)
      this.bad(
        "COLLECTION_PRODUCT_ORDER_INVALID",
        "The order must contain every assigned product exactly once.",
      );
    const result = await this.repository.reorderCollectionProducts(
      storeId,
      id,
      productIds,
    );
    if (result === "invalid_order")
      this.bad(
        "COLLECTION_PRODUCT_ORDER_INVALID",
        "The order must contain every assigned product exactly once.",
      );
    if (!result) this.notFound("COLLECTION_NOT_FOUND", "Collection not found.");
    return CatalogManagementMapper.collection(result);
  }

  async getProduct(
    storeId: string,
    id: string,
  ): Promise<ProductDetailsResponseDto> {
    return CatalogManagementMapper.product(
      await this.requireProduct(storeId, id),
    );
  }
  async updateProduct(
    storeId: string,
    id: string,
    input: UpdateProductDto,
  ): Promise<ProductDetailsResponseDto> {
    const current = await this.requireProduct(storeId, id);
    const price = input.priceMinor ?? current.priceMinor;
    const compare =
      input.compareAtPriceMinor === undefined
        ? current.compareAtPriceMinor
        : input.compareAtPriceMinor;
    if (compare !== null && compare < price)
      this.bad(
        "PRODUCT_PRICE_RELATION_INVALID",
        "Compare-at price must not be lower than the selling price.",
      );
    const values: ProductWrite = {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined ? { slug: this.slug(input.slug) } : {}),
      ...(input.description !== undefined
        ? { description: this.nullable(input.description) }
        : {}),
      ...(input.categoryId !== undefined
        ? { categoryId: input.categoryId }
        : {}),
      ...(input.priceMinor !== undefined
        ? { priceMinor: input.priceMinor }
        : {}),
      ...(input.compareAtPriceMinor !== undefined
        ? { compareAtPriceMinor: input.compareAtPriceMinor }
        : {}),
      ...(input.costPriceMinor !== undefined
        ? { costPriceMinor: input.costPriceMinor }
        : {}),
      ...(input.barcode !== undefined
        ? { barcode: this.nullable(input.barcode) }
        : {}),
      ...(input.keywords !== undefined
        ? {
            keywords: [
              ...new Set(
                input.keywords
                  .map((value) => value.trim().toLowerCase())
                  .filter(Boolean),
              ),
            ],
          }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.collectionIds !== undefined
        ? { collectionIds: input.collectionIds }
        : {}),
    };
    try {
      const result = await this.repository.updateProduct(storeId, id, values);
      if (result === "invalid_category")
        this.bad(
          "PRODUCT_CATEGORY_INVALID",
          "The category does not belong to this store.",
        );
      if (result === "invalid_collections")
        this.bad(
          "PRODUCT_COLLECTIONS_INVALID",
          "One or more collections do not belong to this store.",
        );
      if (!result) this.notFound("PRODUCT_NOT_FOUND", "Product not found.");
      return CatalogManagementMapper.product(result);
    } catch (error) {
      this.rethrowUnique(
        error,
        "PRODUCT_SLUG_CONFLICT",
        "This product slug is already used in this store.",
      );
    }
  }
  archiveProduct(storeId: string, id: string) {
    return this.productArchive(storeId, id, true);
  }
  restoreProduct(storeId: string, id: string) {
    return this.productArchive(storeId, id, false);
  }

  async createOption(
    storeId: string,
    productId: string,
    input: CreateProductOptionDto,
  ) {
    const product = await this.requireProduct(storeId, productId);
    if (product.options.length >= 3)
      this.bad(
        "PRODUCT_OPTION_LIMIT_REACHED",
        "A product can have at most three options.",
      );
    if (
      product.options.some(
        (option) =>
          option.name.toLowerCase() === input.name.trim().toLowerCase(),
      )
    )
      this.conflict(
        "PRODUCT_OPTION_CONFLICT",
        "An option with this name already exists.",
      );
    return this.optionMutation(
      () =>
        this.repository.createOption(storeId, productId, {
          name: input.name.trim(),
          position: input.position,
        }),
      "PRODUCT_OPTION_CONFLICT",
    );
  }
  async updateOption(
    storeId: string,
    productId: string,
    optionId: string,
    input: UpdateProductOptionDto,
  ) {
    const product = await this.requireProduct(storeId, productId);
    const normalizedName = input.name?.trim().toLowerCase();
    if (
      normalizedName !== undefined &&
      product.options.some(
        (option) =>
          option.id !== optionId &&
          option.name.toLowerCase() === normalizedName,
      )
    )
      this.conflict(
        "PRODUCT_OPTION_CONFLICT",
        "An option with this name already exists.",
      );
    return this.optionMutation(
      () =>
        this.repository.updateOption(storeId, productId, optionId, {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.position !== undefined ? { position: input.position } : {}),
        }),
      "PRODUCT_OPTION_CONFLICT",
    );
  }
  deleteOption(storeId: string, productId: string, optionId: string) {
    return this.optionMutation(
      () => this.repository.deleteOption(storeId, productId, optionId),
      "PRODUCT_OPTION_IN_USE",
    );
  }
  async createOptionValue(
    storeId: string,
    productId: string,
    optionId: string,
    input: CreateProductOptionValueDto,
  ) {
    const product = await this.requireProduct(storeId, productId);
    const option = product.options.find((item) => item.id === optionId);
    if (!option)
      this.notFound("PRODUCT_OPTION_NOT_FOUND", "Product option not found.");
    if (
      option.values.some(
        (value) =>
          value.value.toLowerCase() === input.value.trim().toLowerCase(),
      )
    )
      this.conflict(
        "PRODUCT_OPTION_VALUE_CONFLICT",
        "This option value already exists.",
      );
    return this.optionMutation(
      () =>
        this.repository.createOptionValue(storeId, productId, optionId, {
          value: input.value.trim(),
          position: input.position,
        }),
      "PRODUCT_OPTION_VALUE_CONFLICT",
    );
  }
  async updateOptionValue(
    storeId: string,
    productId: string,
    valueId: string,
    input: UpdateProductOptionValueDto,
  ) {
    const product = await this.requireProduct(storeId, productId);
    const normalizedValue = input.value?.trim().toLowerCase();
    if (
      normalizedValue !== undefined &&
      product.options.some((option) =>
        option.values.some(
          (value) =>
            value.id !== valueId &&
            value.value.toLowerCase() === normalizedValue,
        ),
      )
    )
      this.conflict(
        "PRODUCT_OPTION_VALUE_CONFLICT",
        "This option value already exists.",
      );
    return this.optionMutation(
      () =>
        this.repository.updateOptionValue(storeId, productId, valueId, {
          ...(input.value !== undefined ? { value: input.value.trim() } : {}),
          ...(input.position !== undefined ? { position: input.position } : {}),
        }),
      "PRODUCT_OPTION_VALUE_CONFLICT",
    );
  }
  deleteOptionValue(storeId: string, productId: string, valueId: string) {
    return this.optionMutation(
      () => this.repository.deleteOptionValue(storeId, productId, valueId),
      "PRODUCT_OPTION_VALUE_IN_USE",
    );
  }

  async createVariant(
    storeId: string,
    userId: string,
    productId: string,
    input: CreateProductVariantDto,
  ) {
    const product = await this.requireProduct(storeId, productId);
    this.validateVariantPrices(
      input.priceOverrideMinor ?? product.priceMinor,
      input.compareAtPriceMinor,
    );
    const values = {
      ...input,
      title: input.title.trim(),
      sku: input.sku.trim().toUpperCase(),
      barcode: this.nullable(input.barcode),
      priceOverrideMinor: input.priceOverrideMinor ?? null,
      compareAtPriceMinor: input.compareAtPriceMinor ?? null,
      costPriceMinor: input.costPriceMinor ?? null,
      isActive: input.isActive ?? true,
      createdBy: userId,
    };
    return this.variantMutation(() =>
      this.repository.createVariant(storeId, productId, values),
    );
  }
  async updateVariant(
    storeId: string,
    userId: string,
    productId: string,
    variantId: string,
    input: UpdateProductVariantDto,
  ) {
    const product = await this.requireProduct(storeId, productId);
    const current = product.variants.find(
      (variant) => variant.id === variantId,
    );
    if (!current)
      this.notFound("PRODUCT_VARIANT_NOT_FOUND", "Variant not found.");
    this.validateVariantPrices(
      input.priceOverrideMinor ??
        current.priceOverrideMinor ??
        product.priceMinor,
      input.compareAtPriceMinor === undefined
        ? current.compareAtPriceMinor
        : input.compareAtPriceMinor,
    );
    const values: VariantWrite = {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.sku !== undefined
        ? { sku: input.sku.trim().toUpperCase() }
        : {}),
      ...(input.barcode !== undefined
        ? { barcode: this.nullable(input.barcode) }
        : {}),
      ...(input.priceOverrideMinor !== undefined
        ? { priceOverrideMinor: input.priceOverrideMinor }
        : {}),
      ...(input.compareAtPriceMinor !== undefined
        ? { compareAtPriceMinor: input.compareAtPriceMinor }
        : {}),
      ...(input.costPriceMinor !== undefined
        ? { costPriceMinor: input.costPriceMinor }
        : {}),
      ...(input.stockQuantity !== undefined
        ? { stockQuantity: input.stockQuantity }
        : {}),
      ...(input.lowStockThreshold !== undefined
        ? { lowStockThreshold: input.lowStockThreshold }
        : {}),
      ...(input.optionValueIds !== undefined
        ? { optionValueIds: input.optionValueIds }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      createdBy: userId,
    };
    return this.variantMutation(() =>
      this.repository.updateVariant(storeId, productId, variantId, values),
    );
  }
  async archiveVariant(storeId: string, productId: string, variantId: string) {
    const result = await this.repository.archiveVariant(
      storeId,
      productId,
      variantId,
    );
    if (!result)
      this.notFound(
        "PRODUCT_VARIANT_NOT_FOUND",
        "Variant not found or is the required default variant.",
      );
    return CatalogManagementMapper.product(result);
  }

  private async categoryArchive(
    storeId: string,
    id: string,
    archived: boolean,
  ) {
    const row = await this.repository.setCategoryArchived(
      storeId,
      id,
      archived,
    );
    if (!row) this.notFound("CATEGORY_NOT_FOUND", "Category not found.");
    return CatalogManagementMapper.category(row);
  }
  private async collectionArchive(
    storeId: string,
    id: string,
    archived: boolean,
  ) {
    const row = await this.repository.setCollectionArchived(
      storeId,
      id,
      archived,
    );
    if (!row) this.notFound("COLLECTION_NOT_FOUND", "Collection not found.");
    return CatalogManagementMapper.collection(row);
  }
  private async productArchive(storeId: string, id: string, archived: boolean) {
    const row = await this.repository.setProductArchived(storeId, id, archived);
    if (!row) this.notFound("PRODUCT_NOT_FOUND", "Product not found.");
    return CatalogManagementMapper.product(row);
  }
  private async requireCategory(storeId: string, id: string) {
    const row = await this.repository.findCategory(storeId, id);
    if (!row) this.notFound("CATEGORY_NOT_FOUND", "Category not found.");
    return row;
  }
  private async requireCollection(storeId: string, id: string) {
    const row = await this.repository.findCollection(storeId, id);
    if (!row) this.notFound("COLLECTION_NOT_FOUND", "Collection not found.");
    return row;
  }
  private async requireProduct(storeId: string, id: string) {
    const row = await this.repository.findProductDetails(storeId, id);
    if (!row) this.notFound("PRODUCT_NOT_FOUND", "Product not found.");
    return row;
  }
  private async optionMutation(
    action: () => Promise<
      Awaited<ReturnType<CatalogManagementRepository["findProductDetails"]>>
    >,
    code: string,
  ) {
    try {
      const result = await action();
      if (!result)
        this.notFound(
          "PRODUCT_OPTION_NOT_FOUND",
          "Product option or value not found.",
        );
      return CatalogManagementMapper.product(result);
    } catch (error) {
      this.rethrowUnique(
        error,
        code,
        "The option name, position, or value is already used.",
      );
    }
  }
  private async variantMutation(
    action: () => Promise<
      | ProductDetailsEntity
      | "invalid_values"
      | "duplicate_combination"
      | "reserved_stock"
      | null
    >,
  ) {
    try {
      const result = await action();
      if (result === "invalid_values")
        this.bad(
          "PRODUCT_VARIANT_VALUES_INVALID",
          "Variant values must belong to distinct options on this product.",
        );
      if (result === "duplicate_combination")
        this.conflict(
          "PRODUCT_VARIANT_COMBINATION_CONFLICT",
          "This option-value combination already exists.",
        );
      if (result === "reserved_stock")
        this.bad(
          "PRODUCT_VARIANT_STOCK_RESERVED",
          "Stock cannot be lower than reserved quantity.",
        );
      if (!result)
        this.notFound(
          "PRODUCT_VARIANT_NOT_FOUND",
          "Product or variant not found.",
        );
      return CatalogManagementMapper.product(result);
    } catch (error) {
      this.rethrowUnique(
        error,
        "PRODUCT_VARIANT_SKU_CONFLICT",
        "This SKU is already used in this store.",
      );
    }
  }
  private validateVariantPrices(
    price: number,
    compare: number | null | undefined,
  ) {
    if (compare !== null && compare !== undefined && compare < price)
      this.bad(
        "PRODUCT_PRICE_RELATION_INVALID",
        "Compare-at price must not be lower than the selling price.",
      );
  }
  private slug(value: string) {
    const slug = value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 150);
    if (!slug) this.bad("SLUG_INVALID", "A valid slug is required.");
    return slug;
  }
  private nullable(value: string | null | undefined) {
    if (value === null || value === undefined) return null;
    return value.trim() || null;
  }
  private rethrowUnique(error: unknown, code: string, message: string): never {
    if (this.isUnique(error)) this.conflict(code, message);
    throw error;
  }
  private isUnique(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505"
    );
  }
  private bad(code: string, message: string): never {
    throw new BadRequestException({ code, message });
  }
  private conflict(code: string, message: string): never {
    throw new ConflictException({ code, message });
  }
  private notFound(code: string, message: string): never {
    throw new NotFoundException({ code, message });
  }
}
