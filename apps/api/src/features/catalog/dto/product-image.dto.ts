import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class UploadProductImageDto {
  @ApiProperty({ type: "string", format: "binary" })
  file!: string;
}

export class UpdateProductImageDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 250 })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  altText?: string | null;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID()
  variantId?: string | null;
}

export class ReorderProductImagesDto {
  @ApiProperty({ type: [String], format: "uuid", maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID(undefined, { each: true })
  imageIds!: string[];
}

export class ProductImageResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) productId!: string;
  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  variantId!: string | null;
  @ApiProperty() publicUrl!: string;
  @ApiProperty() originalFilename!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() sizeBytes!: number;
  @ApiProperty() width!: number;
  @ApiProperty() height!: number;
  @ApiPropertyOptional({ type: String, nullable: true }) altText!:
    string | null;
  @ApiProperty() position!: number;
  @ApiProperty() isPrimary!: boolean;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ format: "date-time" }) updatedAt!: string;
}

export class ProductImageListResponseDto {
  @ApiProperty({ type: [ProductImageResponseDto] })
  items!: ProductImageResponseDto[];
}

export class ProductImageMessageDto {
  @ApiProperty() message!: string;
}
