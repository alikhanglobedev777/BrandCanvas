import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { STORE_STATUSES, type StoreStatusValue } from "./store-status.dto";

export class UpdateStoreStatusDto {
  @ApiProperty({ enum: STORE_STATUSES })
  @IsIn(STORE_STATUSES)
  status!: StoreStatusValue;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason?: string;
}
