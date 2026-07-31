import { ApiProperty,ApiPropertyOptional } from "@nestjs/swagger";import { IsOptional,IsString,IsUUID,MaxLength,MinLength } from "class-validator";
export class CreateConversationDto{@ApiProperty()@IsString()@MinLength(3)@MaxLength(180)subject!:string;@ApiProperty()@IsString()@MinLength(1)@MaxLength(4000)message!:string;@ApiPropertyOptional({format:"uuid"})@IsOptional()@IsUUID()orderId?:string;}
export class SendMessageDto{@ApiProperty()@IsString()@MinLength(1)@MaxLength(4000)body!:string;}
export class MessageDto{@ApiProperty({format:"uuid"})id!:string;@ApiProperty()senderType!:string;@ApiProperty()body!:string;@ApiProperty({format:"date-time"})createdAt!:string;}
export class ConversationSummaryDto{@ApiProperty({format:"uuid"})id!:string;@ApiProperty()subject!:string;@ApiProperty()status!:string;@ApiProperty({format:"date-time"})lastMessageAt!:string;@ApiProperty()unreadCount!:number;@ApiPropertyOptional({nullable:true})customerName!:string|null;}
export class ConversationListDto{@ApiProperty({type:[ConversationSummaryDto]})items!:ConversationSummaryDto[];}
export class ConversationDetailsDto extends ConversationSummaryDto{@ApiProperty({type:[MessageDto]})messages!:MessageDto[];}
export class MessagingMessageDto{@ApiProperty()message!:string;}
