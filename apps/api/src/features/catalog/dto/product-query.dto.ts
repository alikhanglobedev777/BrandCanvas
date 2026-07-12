import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import {
  PRODUCT_STATUSES,
  STOCK_STATUSES,
  type ProductStatusValue,
  type StockStatusValue,
} from "./catalog.constants";

export class ProductQueryDto {
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
  search?: string;

  @ApiPropertyOptional({ enum: PRODUCT_STATUSES })
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: ProductStatusValue;

  @ApiPropertyOptional({ enum: STOCK_STATUSES })
  @IsOptional()
  @IsIn(STOCK_STATUSES)
  stockStatus?: StockStatusValue;
}
