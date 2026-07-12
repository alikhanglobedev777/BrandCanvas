import { ApiProperty } from "@nestjs/swagger";
import { Matches, MaxLength, MinLength } from "class-validator";

export class StoreSlugParamDto {
  @ApiProperty({ example: "glow-beauty" })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MinLength(3)
  @MaxLength(150)
  slug!: string;
}
