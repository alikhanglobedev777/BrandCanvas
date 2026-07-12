import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export const STORE_THEME_FONTS = [
  "system_sans",
  "system_serif",
  "georgia",
  "arial",
  "verdana",
] as const;
export const STORE_THEME_HEADER_LAYOUTS = [
  "logo_left",
  "logo_centered",
] as const;
export const STORE_THEME_HEADER_STYLES = ["solid", "minimal"] as const;
export const STORE_THEME_FOOTER_STYLES = ["simple", "columns"] as const;
export const STORE_THEME_PRODUCT_CARD_STYLES = [
  "minimal",
  "bordered",
  "elevated",
] as const;
export const STORE_THEME_LIFECYCLES = [
  "draft",
  "published",
  "archived",
] as const;
export type StoreThemeFontValue = (typeof STORE_THEME_FONTS)[number];
export type StoreThemeHeaderLayoutValue =
  (typeof STORE_THEME_HEADER_LAYOUTS)[number];
export type StoreThemeHeaderStyleValue =
  (typeof STORE_THEME_HEADER_STYLES)[number];
export type StoreThemeFooterStyleValue =
  (typeof STORE_THEME_FOOTER_STYLES)[number];
export type StoreThemeProductCardStyleValue =
  (typeof STORE_THEME_PRODUCT_CARD_STYLES)[number];
export type StoreThemeLifecycleValue = (typeof STORE_THEME_LIFECYCLES)[number];

export class ThemeColorsDto {
  @ApiProperty({ example: "#4F46E5", pattern: "^#[0-9A-Fa-f]{6}$" })
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  primary!: string;
  @ApiProperty({ example: "#0F766E", pattern: "^#[0-9A-Fa-f]{6}$" })
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  secondary!: string;
  @ApiProperty({ example: "#FFFFFF", pattern: "^#[0-9A-Fa-f]{6}$" })
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  background!: string;
  @ApiProperty({ example: "#111827", pattern: "^#[0-9A-Fa-f]{6}$" })
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  text!: string;
}

export class ThemeTypographyDto {
  @ApiProperty({ enum: STORE_THEME_FONTS })
  @IsIn(STORE_THEME_FONTS)
  headingFont!: StoreThemeFontValue;
  @ApiProperty({ enum: STORE_THEME_FONTS })
  @IsIn(STORE_THEME_FONTS)
  bodyFont!: StoreThemeFontValue;
}

export class ThemeHeaderDto {
  @ApiProperty({ enum: STORE_THEME_HEADER_LAYOUTS })
  @IsIn(STORE_THEME_HEADER_LAYOUTS)
  layout!: StoreThemeHeaderLayoutValue;
  @ApiProperty({ enum: STORE_THEME_HEADER_STYLES })
  @IsIn(STORE_THEME_HEADER_STYLES)
  style!: StoreThemeHeaderStyleValue;
  @ApiProperty()
  @IsBoolean()
  sticky!: boolean;
  @ApiProperty()
  @IsBoolean()
  showLogo!: boolean;
}

export class ThemeFooterDto {
  @ApiProperty({ enum: STORE_THEME_FOOTER_STYLES })
  @IsIn(STORE_THEME_FOOTER_STYLES)
  style!: StoreThemeFooterStyleValue;
  @ApiProperty()
  @IsBoolean()
  showContact!: boolean;
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[^<>]*$/, { message: "footer text must not contain HTML." })
  text?: string | null;
}

export class ThemeShapeDto {
  @ApiProperty({ type: ThemeColorsDto })
  @ValidateNested()
  @Type(() => ThemeColorsDto)
  colors!: ThemeColorsDto;
  @ApiProperty({ type: ThemeTypographyDto })
  @ValidateNested()
  @Type(() => ThemeTypographyDto)
  typography!: ThemeTypographyDto;
  @ApiProperty({ type: ThemeHeaderDto })
  @ValidateNested()
  @Type(() => ThemeHeaderDto)
  header!: ThemeHeaderDto;
  @ApiProperty({ type: ThemeFooterDto })
  @ValidateNested()
  @Type(() => ThemeFooterDto)
  footer!: ThemeFooterDto;
  @ApiProperty({ minimum: 0, maximum: 32, example: 8 })
  @IsInt()
  @Min(0)
  @Max(32)
  buttonRadius!: number;
  @ApiProperty({ minimum: 0, maximum: 32, example: 12 })
  @IsInt()
  @Min(0)
  @Max(32)
  cardRadius!: number;
  @ApiProperty({ enum: STORE_THEME_PRODUCT_CARD_STYLES })
  @IsIn(STORE_THEME_PRODUCT_CARD_STYLES)
  productCardStyle!: StoreThemeProductCardStyleValue;
}

export class SaveThemeDraftDto extends ThemeShapeDto {
  @ApiProperty({ minimum: 1, description: "Revision loaded before editing." })
  @IsInt()
  @Min(1)
  expectedRevision!: number;
}

export class PublishThemeDto {
  @ApiProperty({ minimum: 1, description: "Saved draft revision to publish." })
  @IsInt()
  @Min(1)
  expectedRevision!: number;
}

export class StoreThemeResponseDto extends ThemeShapeDto {
  @ApiProperty({ format: "uuid" })
  id!: string;
  @ApiProperty({ format: "uuid" })
  storeId!: string;
  @ApiProperty({ enum: STORE_THEME_LIFECYCLES })
  lifecycle!: StoreThemeLifecycleValue;
  @ApiProperty()
  revision!: number;
  @ApiPropertyOptional({ type: Number, nullable: true })
  publishedVersion!: number | null;
  @ApiPropertyOptional({ type: String, nullable: true, format: "date-time" })
  publishedAt!: string | null;
  @ApiProperty({ format: "date-time" })
  createdAt!: string;
  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}

export class ThemeVersionListResponseDto {
  @ApiProperty({ type: [StoreThemeResponseDto] })
  items!: StoreThemeResponseDto[];
}
