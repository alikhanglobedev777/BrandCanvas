import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsIn, IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from "class-validator";
export class StartCheckoutDto {
 @ApiProperty() @IsString() @MaxLength(150) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) storeSlug!:string;
 @ApiProperty({maxLength:120}) @IsString() @MaxLength(120) idempotencyKey!:string;
}
export class CheckoutQueryDto { @ApiProperty() @IsString() @MaxLength(150) storeSlug!:string; }
export class SaveCheckoutAddressDto {
 @ApiProperty() @IsString() @MaxLength(150) storeSlug!:string;
 @ApiProperty({enum:["shipping","billing"]}) @IsIn(["shipping","billing"]) type!:"shipping"|"billing";
 @ApiProperty() @IsString() @MaxLength(80) firstName!:string;
 @ApiProperty() @IsString() @MaxLength(80) lastName!:string;
 @ApiProperty() @IsString() @MaxLength(32) phone!:string;
 @ApiProperty() @IsString() @MaxLength(200) addressLine1!:string;
 @ApiPropertyOptional({nullable:true}) @IsOptional() @IsString() @MaxLength(200) addressLine2?:string|null;
 @ApiProperty() @IsString() @MaxLength(100) city!:string;
 @ApiProperty() @IsString() @MaxLength(100) region!:string;
 @ApiPropertyOptional({nullable:true}) @IsOptional() @IsString() @MaxLength(24) postalCode?:string|null;
 @ApiProperty({example:"PK"}) @IsString() @Length(2,2) countryCode!:string;
 @ApiPropertyOptional() @IsOptional() @IsEmail() guestEmail?:string;
}
export class CheckoutAddressDto extends SaveCheckoutAddressDto { @ApiProperty({format:"uuid"}) id!:string; }
export class CheckoutItemDto { @ApiProperty({format:"uuid"}) productId!:string;@ApiProperty({format:"uuid"}) variantId!:string;@ApiProperty() name!:string;@ApiProperty() variantTitle!:string;@ApiProperty() quantity!:number;@ApiProperty() unitPriceMinor!:number;@ApiProperty() lineTotalMinor!:number; }
export class CheckoutResponseDto {
 @ApiProperty({format:"uuid"}) id!:string;@ApiProperty({format:"uuid"}) cartId!:string;@ApiProperty() storeSlug!:string;@ApiProperty({enum:["active","ready","completed","cancelled","expired"]}) status!:string;@ApiProperty() currency!:string;@ApiProperty({type:[CheckoutItemDto]}) items!:CheckoutItemDto[];@ApiProperty({type:[CheckoutAddressDto]}) addresses!:CheckoutAddressDto[];@ApiProperty() subtotalMinor!:number;@ApiProperty() discountMinor!:number;@ApiProperty() shippingMinor!:number;@ApiProperty() taxMinor!:number;@ApiProperty() totalMinor!:number;@ApiProperty({format:"date-time"}) expiresAt!:string;
}
