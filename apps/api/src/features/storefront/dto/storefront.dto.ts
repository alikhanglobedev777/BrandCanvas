import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export const PUBLIC_PRODUCT_SORTS = [
  "newest",
  "price_ascending",
  "price_descending",
  "name_ascending",
  "name_descending",
] as const;
export type PublicProductSort = (typeof PUBLIC_PRODUCT_SORTS)[number];

export class StorefrontTenantQueryDto {
  @ApiPropertyOptional({ description: "Development fallback store slug." })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  storeSlug?: string;
}

export class PublicProductQueryDto extends StorefrontTenantQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 48 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  pageSize = 12;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  categorySlug?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  collectionSlug?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  minPriceMinor?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  maxPriceMinor?: number;

  @ApiPropertyOptional({ enum: PUBLIC_PRODUCT_SORTS, default: "newest" })
  @IsOptional()
  @IsIn(PUBLIC_PRODUCT_SORTS)
  sort: PublicProductSort = "newest";
}

export class PublicImageDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() url!: string;
  @ApiPropertyOptional({ nullable: true }) altText!: string | null;
  @ApiProperty() position!: number;
  @ApiProperty() isPrimary!: boolean;
}

export class PublicStockDto {
  @ApiProperty({ enum: ["in_stock", "low_stock", "out_of_stock"] })
  status!: "in_stock" | "low_stock" | "out_of_stock";
  @ApiProperty() availableForSale!: boolean;
}

export class PublicVariantDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() priceMinor!: number;
  @ApiPropertyOptional({ nullable: true }) compareAtPriceMinor!: number | null;
  @ApiProperty({ type: [String] }) optionValueIds!: string[];
  @ApiProperty({ type: PublicStockDto }) stock!: PublicStockDto;
}

export class PublicOptionValueDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() value!: string;
}
export class PublicOptionDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: [PublicOptionValueDto] }) values!: PublicOptionValueDto[];
}

export class PublicProductSummaryDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty() priceMinor!: number;
  @ApiPropertyOptional({ nullable: true }) compareAtPriceMinor!: number | null;
  @ApiPropertyOptional({ type: PublicImageDto, nullable: true }) primaryImage!: PublicImageDto | null;
  @ApiProperty({ type: PublicStockDto }) stock!: PublicStockDto;
}

export class PublicProductListDto {
  @ApiProperty({ type: [PublicProductSummaryDto] }) items!: PublicProductSummaryDto[];
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class PublicProductDetailsDto extends PublicProductSummaryDto {
  @ApiProperty({ type: [PublicImageDto] }) images!: PublicImageDto[];
  @ApiProperty({ type: [PublicOptionDto] }) options!: PublicOptionDto[];
  @ApiProperty({ type: [PublicVariantDto] }) variants!: PublicVariantDto[];
  @ApiPropertyOptional({ nullable: true }) categoryName!: string | null;
  @ApiPropertyOptional({ nullable: true }) categorySlug!: string | null;
  @ApiProperty() currency!: string;
}

export class PublicCategoryDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
}
export class PublicCategoryListDto {
  @ApiProperty({ type: [PublicCategoryDto] }) items!: PublicCategoryDto[];
}
export class PublicCollectionDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
}
export class PublicCollectionListDto {
  @ApiProperty({ type: [PublicCollectionDto] }) items!: PublicCollectionDto[];
}

export class PublicThemeDto {
  @ApiProperty() primaryColor!: string;
  @ApiProperty() secondaryColor!: string;
  @ApiProperty() backgroundColor!: string;
  @ApiProperty() textColor!: string;
  @ApiProperty() headingFont!: string;
  @ApiProperty() bodyFont!: string;
  @ApiProperty() buttonRadius!: number;
  @ApiProperty() cardRadius!: number;
  @ApiProperty() headerStyle!: string;
  @ApiProperty() footerStyle!: string;
  @ApiProperty() productCardStyle!: string;
}

export class PublicStorefrontDto {
  @ApiProperty({ format: "uuid" }) storeId!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional({ nullable: true }) logoUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) faviconUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) contactEmail!: string | null;
  @ApiPropertyOptional({ nullable: true }) contactPhone!: string | null;
  @ApiProperty({ type: PublicThemeDto }) theme!: PublicThemeDto;
}

export class PublicStorefrontHomeDto {
  @ApiProperty({ type: PublicStorefrontDto }) storefront!: PublicStorefrontDto;
  @ApiProperty({ type: [PublicCategoryDto] }) categories!: PublicCategoryDto[];
  @ApiProperty({ type: [PublicCollectionDto] }) collections!: PublicCollectionDto[];
  @ApiProperty({ type: [PublicProductSummaryDto] }) featuredProducts!: PublicProductSummaryDto[];
}
