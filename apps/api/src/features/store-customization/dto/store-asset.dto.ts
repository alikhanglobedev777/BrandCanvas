import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export const STORE_ASSET_CATEGORIES = ["logo", "favicon"] as const;
export type StoreAssetCategoryValue =
  (typeof STORE_ASSET_CATEGORIES)[number];

export class UploadStoreAssetDto {
  @ApiProperty({ type: "string", format: "binary" })
  file!: string;
}

export class StoreAssetResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;
  @ApiProperty({ format: "uuid" })
  storeId!: string;
  @ApiProperty({ enum: STORE_ASSET_CATEGORIES })
  category!: StoreAssetCategoryValue;
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

export class StoreAssetListResponseDto {
  @ApiProperty({ type: [StoreAssetResponseDto] })
  items!: StoreAssetResponseDto[];
}

export class StoreCustomizationMessageDto {
  @ApiProperty()
  message!: string;
}
