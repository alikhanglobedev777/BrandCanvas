import { ApiProperty } from "@nestjs/swagger";

export class MessageResponseDto {
  @ApiProperty({ example: "Signed out successfully." })
  message!: string;
}
