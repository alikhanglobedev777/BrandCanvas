import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsMimeType,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class RegisterStoreAssetDto {
  @ApiPropertyOptional({
    format: "uuid",
    description: "Provide to update existing metadata owned by this store.",
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    example: "logo",
    description: "logo, favicon, banner, or a future snake-case category.",
  })
  @Matches(/^[a-z][a-z0-9_]{0,49}$/)
  category!: string;

  @ApiProperty({ example: "local" })
  @IsString()
  @MaxLength(32)
  storageProvider!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  storageKey!: string;

  @ApiProperty({ format: "uri" })
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  publicUrl!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(255)
  @Matches(/^[^<>]*$/, {
    message: "originalFilename contains unsupported characters.",
  })
  originalFilename!: string;

  @ApiProperty({ example: "image/png" })
  @IsMimeType()
  mimeType!: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000_000)
  sizeBytes!: number;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  height?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isCurrent = true;
}

export class StoreAssetResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;
  @ApiProperty({ format: "uuid" })
  storeId!: string;
  @ApiProperty()
  category!: string;
  @ApiProperty()
  storageProvider!: string;
  @ApiProperty({ format: "uri" })
  publicUrl!: string;
  @ApiProperty()
  originalFilename!: string;
  @ApiProperty()
  mimeType!: string;
  @ApiProperty()
  sizeBytes!: number;
  @ApiPropertyOptional({ type: Number, nullable: true })
  width!: number | null;
  @ApiPropertyOptional({ type: Number, nullable: true })
  height!: number | null;
  @ApiProperty()
  isCurrent!: boolean;
  @ApiProperty({ format: "date-time" })
  createdAt!: string;
  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}

export class StoreCustomizationMessageDto {
  @ApiProperty()
  message!: string;
}
