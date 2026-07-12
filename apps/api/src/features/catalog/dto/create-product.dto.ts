import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from "class-validator";
import { PRODUCT_STATUSES, type ProductStatusValue } from "./catalog.constants";

export class CreateProductDto {
  @ApiProperty({ example: "Classic T-Shirt" })
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @ApiPropertyOptional({ example: "Premium cotton t-shirt." })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: "TSHIRT-BLK-M" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  sku!: string;

  @ApiProperty({ example: "2500.00", pattern: "^\\d+(?:\\.\\d{1,2})?$" })
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  price!: string;

  @ApiPropertyOptional({ example: "3000.00", pattern: "^\\d+(?:\\.\\d{1,2})?$" })
  @IsOptional()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  compareAtPrice?: string;

  @ApiProperty({ type: Number, default: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  initialStock = 0;

  @ApiProperty({ type: Number, default: 5, minimum: 0, maximum: 1000000 })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  lowStockThreshold = 5;

  @ApiProperty({ enum: PRODUCT_STATUSES, default: "draft" })
  @IsIn(PRODUCT_STATUSES)
  status: ProductStatusValue = "draft";
}
