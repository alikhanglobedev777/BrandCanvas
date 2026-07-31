import { ApiProperty } from "@nestjs/swagger";
export class NotificationDto{@ApiProperty({format:"uuid"})id!:string;@ApiProperty()type!:string;@ApiProperty()title!:string;@ApiProperty()body!:string;@ApiProperty()status!:string;@ApiProperty({format:"date-time"})createdAt!:string;}
export class NotificationListDto{@ApiProperty({type:[NotificationDto]})items!:NotificationDto[];@ApiProperty()unreadCount!:number;}
export class NotificationMessageDto{@ApiProperty()message!:string;}
