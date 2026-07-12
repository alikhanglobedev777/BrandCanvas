import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsIn, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { STORE_STATUSES, type StoreStatusValue } from "./store-status.dto";

export class CreateStoreDto {
  @ApiProperty({ example: "Sara Khan" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  sellerName!: string;

  @ApiProperty({ example: "sara@example.com" })
  @IsEmail()
  sellerEmail!: string;

  @ApiProperty({ example: "Glow Beauty" })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  storeName!: string;

  @ApiProperty({ example: "glow-beauty" })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MinLength(3)
  @MaxLength(63)
  subdomain!: string;

  @ApiProperty({ enum: STORE_STATUSES, default: "active" })
  @IsIn(STORE_STATUSES)
  status: StoreStatusValue = "active";
}
