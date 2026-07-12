import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PRODUCT_STATUSES, STOCK_STATUSES, type ProductStatusValue, type StockStatusValue } from "./catalog.constants";

export class ProductResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ format: "uuid" })
  variantId!: string;

  @ApiProperty({ format: "uuid" })
  inventoryItemId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ enum: PRODUCT_STATUSES })
  status!: ProductStatusValue;

  @ApiProperty()
  sku!: string;

  @ApiProperty({ example: "2500.00" })
  price!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: "3000.00" })
  compareAtPrice!: string | null;

  @ApiProperty({ type: Number })
  stockQuantity!: number;

  @ApiProperty({ type: Number })
  reservedQuantity!: number;

  @ApiProperty({ type: Number })
  availableQuantity!: number;

  @ApiProperty({ type: Number })
  lowStockThreshold!: number;

  @ApiProperty({ enum: STOCK_STATUSES })
  stockStatus!: StockStatusValue;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}
