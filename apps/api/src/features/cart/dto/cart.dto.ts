import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from "class-validator";

export class CartTenantQueryDto {
  @ApiProperty({ description: "Store slug used by the development storefront route." })
  @IsString() @MaxLength(150) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) storeSlug!: string;
}
export class AddCartItemDto extends CartTenantQueryDto {
  @ApiProperty({ format: "uuid" }) @IsUUID() productId!: string;
  @ApiProperty({ format: "uuid" }) @IsUUID() variantId!: string;
  @ApiProperty({ minimum: 1, maximum: 99 }) @Type(() => Number) @IsInt() @Min(1) @Max(99) quantity!: number;
}
export class UpdateCartItemDto extends CartTenantQueryDto {
  @ApiProperty({ minimum: 1, maximum: 99 }) @Type(() => Number) @IsInt() @Min(1) @Max(99) quantity!: number;
}
export class CartItemDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) productId!: string;
  @ApiProperty({ format: "uuid" }) variantId!: string;
  @ApiProperty() productName!: string;
  @ApiProperty() productSlug!: string;
  @ApiProperty() variantTitle!: string;
  @ApiPropertyOptional({ nullable: true }) imageUrl!: string | null;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPriceMinor!: number;
  @ApiProperty() lineTotalMinor!: number;
  @ApiProperty() availableForSale!: boolean;
  @ApiPropertyOptional({ nullable: true }) warning!: string | null;
}
export class CartResponseDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() storeSlug!: string;
  @ApiProperty() currency!: string;
  @ApiProperty({ type: [CartItemDto] }) items!: CartItemDto[];
  @ApiProperty() itemCount!: number;
  @ApiProperty() subtotalMinor!: number;
  @ApiProperty({ format: "date-time" }) expiresAt!: string;
}
export class CartMessageDto { @ApiProperty() message!: string; }
