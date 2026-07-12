import { ApiProperty } from "@nestjs/swagger";
import { ProductResponseDto } from "./product-response.dto";

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  items!: ProductResponseDto[];

  @ApiProperty({ type: Number })
  page!: number;

  @ApiProperty({ type: Number })
  pageSize!: number;

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  totalPages!: number;
}
