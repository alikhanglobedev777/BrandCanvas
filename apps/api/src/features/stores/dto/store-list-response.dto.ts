import { ApiProperty } from "@nestjs/swagger";
import { StoreResponseDto } from "./store-response.dto";

export class StoreListResponseDto {
  @ApiProperty({ type: [StoreResponseDto] })
  items!: StoreResponseDto[];
  @ApiProperty()
  page!: number;
  @ApiProperty()
  pageSize!: number;
  @ApiProperty()
  total!: number;
  @ApiProperty()
  totalPages!: number;
}
