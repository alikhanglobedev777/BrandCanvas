import { ApiProperty,ApiPropertyOptional } from "@nestjs/swagger";import { IsBoolean,IsOptional,IsString,MaxLength } from "class-validator";
export class PaymentMethodsQueryDto{@ApiProperty()@IsString()@MaxLength(150)storeSlug!:string;}
export class PublicPaymentMethodDto{@ApiProperty()code!:string;@ApiProperty()name!:string;@ApiProperty()enabled!:boolean;}
export class PublicPaymentMethodsDto{@ApiProperty({type:[PublicPaymentMethodDto]})items!:PublicPaymentMethodDto[];}
export class PaymentSettingsDto{@ApiProperty()codEnabled!:boolean;@ApiProperty()onlinePaymentsEnabled!:boolean;}
export class UpdatePaymentSettingsDto{@ApiProperty()@IsBoolean()codEnabled!:boolean;}
export class PaymentResponseDto{@ApiProperty({format:"uuid"})id!:string;@ApiProperty({format:"uuid"})orderId!:string;@ApiProperty()orderNumber!:string;@ApiProperty()provider!:string;@ApiProperty()status!:string;@ApiProperty()currency!:string;@ApiProperty()amountMinor!:number;@ApiPropertyOptional({nullable:true,format:"date-time"})collectedAt!:string|null;}
export class PaymentListDto{@ApiProperty({type:[PaymentResponseDto]})items!:PaymentResponseDto[];}
export class MarkCodCollectedDto{@ApiPropertyOptional()@IsOptional()@IsString()@MaxLength(500)note?:string;}
