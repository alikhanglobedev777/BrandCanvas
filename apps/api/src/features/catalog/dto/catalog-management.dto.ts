import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { PRODUCT_STATUSES, type ProductStatusValue } from "./catalog.constants";

export const CATEGORY_STATUSES = ["active", "inactive"] as const;
export const COLLECTION_STATUSES = ["draft", "published"] as const;
export type CategoryStatusValue = (typeof CATEGORY_STATUSES)[number];
export type CollectionStatusValue = (typeof COLLECTION_STATUSES)[number];

export class CatalogPageQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
}

export class CategoryQueryDto extends CatalogPageQueryDto {
  @ApiPropertyOptional({ enum: CATEGORY_STATUSES })
  @IsOptional()
  @IsIn(CATEGORY_STATUSES)
  status?: CategoryStatusValue;

  @ApiPropertyOptional({ type: Boolean })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" })
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(150)
  slug?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID()
  imageAssetId?: string | null;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ enum: CATEGORY_STATUSES, default: "active" })
  @IsOptional()
  @IsIn(CATEGORY_STATUSES)
  status?: CategoryStatusValue;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) storeId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description!:
    string | null;
  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  imageAssetId!: string | null;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ enum: CATEGORY_STATUSES }) status!: CategoryStatusValue;
  @ApiPropertyOptional({ type: String, nullable: true, format: "date-time" })
  archivedAt!: string | null;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ format: "date-time" }) updatedAt!: string;
}

export class CategoryListResponseDto extends CatalogPageQueryDto {
  @ApiProperty({ type: [CategoryResponseDto] }) items!: CategoryResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class CollectionQueryDto extends CatalogPageQueryDto {
  @ApiPropertyOptional({ enum: COLLECTION_STATUSES })
  @IsOptional()
  @IsIn(COLLECTION_STATUSES)
  status?: CollectionStatusValue;

  @ApiPropertyOptional({ type: Boolean })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class CreateCollectionDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title!: string;

  @ApiPropertyOptional({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" })
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(150)
  slug?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ enum: COLLECTION_STATUSES, default: "draft" })
  @IsOptional()
  @IsIn(COLLECTION_STATUSES)
  status?: CollectionStatusValue;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}

export class CollectionProductResponseDto {
  @ApiProperty({ format: "uuid" }) productId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() sortOrder!: number;
}

export class CollectionResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) storeId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description!:
    string | null;
  @ApiProperty({ enum: COLLECTION_STATUSES }) status!: CollectionStatusValue;
  @ApiProperty() sortOrder!: number;
  @ApiPropertyOptional({ type: String, nullable: true, format: "date-time" })
  archivedAt!: string | null;
  @ApiProperty({ type: [CollectionProductResponseDto] })
  products!: CollectionProductResponseDto[];
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ format: "date-time" }) updatedAt!: string;
}

export class CollectionListResponseDto extends CatalogPageQueryDto {
  @ApiProperty({ type: [CollectionResponseDto] })
  items!: CollectionResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class ProductIdsDto {
  @ApiProperty({ type: [String], format: "uuid", maxItems: 100 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  productIds!: string[];
}

export class ReorderCollectionProductsDto {
  @ApiProperty({ type: [String], format: "uuid", maxItems: 1000 })
  @IsArray()
  @ArrayMaxSize(1000)
  @IsUUID(undefined, { each: true })
  productIds!: string[];
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name?: string;
  @ApiPropertyOptional({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" })
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(180)
  slug?: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;
  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceMinor?: number;
  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPriceMinor?: number | null;
  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  costPriceMinor?: number | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string | null;
  @ApiPropertyOptional({ type: [String], maxItems: 30 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  keywords?: string[];
  @ApiPropertyOptional({ enum: PRODUCT_STATUSES })
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: ProductStatusValue;
  @ApiPropertyOptional({ type: [String], format: "uuid" })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  collectionIds?: string[];
}

export class CreateProductOptionDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80) name!: string;
  @ApiProperty({ minimum: 0, maximum: 2 })
  @IsInt()
  @Min(0)
  @Max(2)
  position!: number;
}
export class UpdateProductOptionDto extends PartialType(
  CreateProductOptionDto,
) {}

export class CreateProductOptionValueDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(100) value!: string;
  @ApiProperty({ minimum: 0, maximum: 99 })
  @IsInt()
  @Min(0)
  @Max(99)
  position!: number;
}
export class UpdateProductOptionValueDto extends PartialType(
  CreateProductOptionValueDto,
) {}

export class CreateProductVariantDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(180) title!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(100) sku!: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string | null;
  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceOverrideMinor?: number | null;
  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  compareAtPriceMinor?: number | null;
  @ApiPropertyOptional({ type: Number, minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  costPriceMinor?: number | null;
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) stockQuantity!: number;
  @ApiProperty({ minimum: 0 }) @IsInt() @Min(0) lowStockThreshold!: number;
  @ApiProperty({ type: [String], format: "uuid", maxItems: 3 })
  @IsArray()
  @ArrayMaxSize(3)
  @IsUUID(undefined, { each: true })
  optionValueIds!: string[];
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
export class UpdateProductVariantDto extends PartialType(
  CreateProductVariantDto,
) {}

export class ProductOptionValueResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() value!: string;
  @ApiProperty() position!: number;
}
export class ProductOptionResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() position!: number;
  @ApiProperty({ type: [ProductOptionValueResponseDto] })
  values!: ProductOptionValueResponseDto[];
}
export class ProductVariantResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() sku!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) barcode!:
    string | null;
  @ApiPropertyOptional({ type: Number, nullable: true }) priceOverrideMinor!:
    number | null;
  @ApiPropertyOptional({ type: Number, nullable: true }) compareAtPriceMinor!:
    number | null;
  @ApiPropertyOptional({ type: Number, nullable: true }) costPriceMinor!:
    number | null;
  @ApiProperty() stockQuantity!: number;
  @ApiProperty() reservedQuantity!: number;
  @ApiProperty() availableQuantity!: number;
  @ApiProperty() lowStockThreshold!: number;
  @ApiProperty({ enum: ["in_stock", "low_stock", "out_of_stock"] })
  stockStatus!: "in_stock" | "low_stock" | "out_of_stock";
  @ApiProperty() isActive!: boolean;
  @ApiProperty() isDefault!: boolean;
  @ApiPropertyOptional({ type: String, nullable: true, format: "date-time" })
  archivedAt!: string | null;
  @ApiProperty({ type: [String], format: "uuid" }) optionValueIds!: string[];
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ format: "date-time" }) updatedAt!: string;
}
export class ProductDetailsResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) storeId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description!:
    string | null;
  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  categoryId!: string | null;
  @ApiProperty() priceMinor!: number;
  @ApiPropertyOptional({ type: Number, nullable: true }) compareAtPriceMinor!:
    number | null;
  @ApiPropertyOptional({ type: Number, nullable: true }) costPriceMinor!:
    number | null;
  @ApiPropertyOptional({ type: String, nullable: true }) barcode!:
    string | null;
  @ApiProperty({ type: [String] }) keywords!: string[];
  @ApiProperty({ enum: PRODUCT_STATUSES }) status!: ProductStatusValue;
  @ApiPropertyOptional({ type: String, nullable: true, format: "date-time" })
  archivedAt!: string | null;
  @ApiProperty({ type: [String], format: "uuid" }) collectionIds!: string[];
  @ApiProperty({ type: [ProductOptionResponseDto] })
  options!: ProductOptionResponseDto[];
  @ApiProperty({ type: [ProductVariantResponseDto] })
  variants!: ProductVariantResponseDto[];
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ format: "date-time" }) updatedAt!: string;
}

export class CatalogMessageDto {
  @ApiProperty() message!: string;
}
