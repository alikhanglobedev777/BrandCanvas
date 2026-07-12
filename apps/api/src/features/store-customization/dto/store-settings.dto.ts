import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

const PLAIN_TEXT_PATTERN = /^[^<>]*$/;
const URL_OPTIONS = { protocols: ["http", "https"], require_protocol: true };

export class StoreSocialLinksDto {
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsUrl(URL_OPTIONS)
  facebookUrl?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsUrl(URL_OPTIONS)
  instagramUrl?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsUrl(URL_OPTIONS)
  youtubeUrl?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsUrl(URL_OPTIONS)
  tiktokUrl?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsUrl(URL_OPTIONS)
  xUrl?: string | null;
}

export class UpdateStoreSettingsDto {
  @ApiPropertyOptional({ minLength: 2, maxLength: 150 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @Matches(PLAIN_TEXT_PATTERN, {
    message: "displayName must not contain HTML.",
  })
  displayName?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Matches(PLAIN_TEXT_PATTERN, {
    message: "description must not contain HTML.",
  })
  description?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, format: "email" })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 32 })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[+0-9().\-\s]*$/, {
    message: "contactPhone contains unsupported characters.",
  })
  contactPhone?: string | null;

  @ApiPropertyOptional({ type: StoreSocialLinksDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StoreSocialLinksDto)
  socialLinks?: StoreSocialLinksDto;
}

export class StoreSettingsResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;
  @ApiProperty({ format: "uuid" })
  storeId!: string;
  @ApiProperty()
  displayName!: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, format: "email" })
  contactEmail!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  contactPhone!: string | null;
  @ApiProperty({ type: StoreSocialLinksDto })
  socialLinks!: StoreSocialLinksDto;
  @ApiProperty({ format: "date-time" })
  createdAt!: string;
  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}
