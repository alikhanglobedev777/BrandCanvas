import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { INVENTORY_ADJUSTMENT_TYPES, type InventoryAdjustmentTypeValue } from "./catalog.constants";

export class InventoryAdjustmentDto {
  @ApiProperty({ enum: INVENTORY_ADJUSTMENT_TYPES })
  @IsIn(INVENTORY_ADJUSTMENT_TYPES)
  type!: InventoryAdjustmentTypeValue;

  @ApiProperty({ type: Number, minimum: 1, maximum: 1000000 })
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity!: number;

  @ApiProperty({ example: "New supplier stock received." })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
