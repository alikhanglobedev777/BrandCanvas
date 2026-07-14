import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { CatalogPageQueryDto } from "./catalog-management.dto";

export const INVENTORY_ADJUSTMENT_OPERATIONS = [
  "increase",
  "decrease",
  "set",
] as const;
export type InventoryAdjustmentOperationValue =
  (typeof INVENTORY_ADJUSTMENT_OPERATIONS)[number];

export const INVENTORY_MOVEMENT_TYPES = [
  "initial_stock",
  "purchase",
  "return",
  "order_cancelled",
  "damaged",
  "manual_increase",
  "manual_decrease",
  "set_quantity",
  "reservation",
  "reservation_release",
  "reservation_expiry",
  "sale",
  "cancellation_restore",
  "return_restore",
  "correction",
] as const;
export type InventoryMovementTypeValue =
  (typeof INVENTORY_MOVEMENT_TYPES)[number];

export const INVENTORY_RESERVATION_STATUSES = [
  "active",
  "converted",
  "released",
  "expired",
  "cancelled",
] as const;
export type InventoryReservationStatusValue =
  (typeof INVENTORY_RESERVATION_STATUSES)[number];

export class InventoryQueryDto extends CatalogPageQueryDto {
  @ApiPropertyOptional({ enum: ["in_stock", "low_stock", "out_of_stock"] })
  @IsOptional()
  @IsIn(["in_stock", "low_stock", "out_of_stock"])
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class InventoryMovementQueryDto extends CatalogPageQueryDto {
  @ApiPropertyOptional({ enum: INVENTORY_MOVEMENT_TYPES })
  @IsOptional()
  @IsIn(INVENTORY_MOVEMENT_TYPES)
  movementType?: InventoryMovementTypeValue;
}

export class InventoryAdjustmentRequestDto {
  @ApiProperty({ enum: INVENTORY_ADJUSTMENT_OPERATIONS })
  @IsIn(INVENTORY_ADJUSTMENT_OPERATIONS)
  operation!: InventoryAdjustmentOperationValue;

  @ApiProperty({ minimum: 0, maximum: 1_000_000 })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  quantity!: number;

  @ApiProperty({ minLength: 3, maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({ minLength: 8, maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(80)
  idempotencyKey?: string;
}

export class UpdateLowStockThresholdDto {
  @ApiProperty({ minimum: 0, maximum: 1_000_000 })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  lowStockThreshold!: number;

  @ApiProperty({ minLength: 3, maxLength: 500 })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({ minLength: 8, maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(80)
  idempotencyKey?: string;
}

export class ReserveInventoryDto {
  @ApiProperty({ minimum: 1, maximum: 1_000_000 })
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  quantity!: number;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  referenceType!: string;

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  referenceId!: string;

  @ApiProperty({ minLength: 8, maxLength: 80 })
  @IsString()
  @MinLength(8)
  @MaxLength(80)
  idempotencyKey!: string;

  @ApiProperty({ format: "date-time" })
  @IsISO8601({ strict: true })
  expiresAt!: string;
}

export class InventoryItemResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) productId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty({ format: "uuid" }) variantId!: string;
  @ApiProperty() variantTitle!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() stockQuantity!: number;
  @ApiProperty() reservedQuantity!: number;
  @ApiProperty() availableQuantity!: number;
  @ApiProperty() lowStockThreshold!: number;
  @ApiProperty({ enum: ["in_stock", "low_stock", "out_of_stock"] })
  stockStatus!: "in_stock" | "low_stock" | "out_of_stock";
  @ApiProperty() isAvailable!: boolean;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ format: "date-time" }) updatedAt!: string;
}

export class InventoryListResponseDto extends CatalogPageQueryDto {
  @ApiProperty({ type: [InventoryItemResponseDto] })
  items!: InventoryItemResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class ProductInventoryResponseDto {
  @ApiProperty({ format: "uuid" }) productId!: string;
  @ApiProperty({ type: [InventoryItemResponseDto] })
  items!: InventoryItemResponseDto[];
}

export class InventoryMovementResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ enum: INVENTORY_MOVEMENT_TYPES })
  movementType!: InventoryMovementTypeValue;
  @ApiProperty() quantityDelta!: number;
  @ApiProperty() stockBefore!: number;
  @ApiProperty() stockAfter!: number;
  @ApiProperty() reservedBefore!: number;
  @ApiProperty() reservedAfter!: number;
  @ApiPropertyOptional({ type: String, nullable: true }) reason!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) referenceType!:
    string | null;
  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  referenceId!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) actorName!:
    string | null;
  @ApiProperty({ type: Object, additionalProperties: true })
  metadata!: Record<string, string | number | boolean | null>;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
}

export class InventoryMovementListResponseDto extends CatalogPageQueryDto {
  @ApiProperty({ type: [InventoryMovementResponseDto] })
  items!: InventoryMovementResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

export class InventoryReservationResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) inventoryItemId!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty({ enum: INVENTORY_RESERVATION_STATUSES })
  status!: InventoryReservationStatusValue;
  @ApiProperty() referenceType!: string;
  @ApiProperty({ format: "uuid" }) referenceId!: string;
  @ApiProperty({ format: "date-time" }) expiresAt!: string;
  @ApiPropertyOptional({ type: String, format: "date-time", nullable: true })
  releasedAt!: string | null;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
  @ApiProperty({ format: "date-time" }) updatedAt!: string;
}

export class InventoryReservationOperationResponseDto {
  @ApiProperty({ type: InventoryItemResponseDto })
  inventory!: InventoryItemResponseDto;
  @ApiProperty({ type: InventoryReservationResponseDto })
  reservation!: InventoryReservationResponseDto;
}
