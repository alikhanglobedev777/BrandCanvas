import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { STORE_STATUSES, type StoreStatusValue } from "./store-status.dto";

export class StoreOwnerDto {
  @ApiProperty({ format: "uuid" })
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty({ format: "email" })
  email!: string;
}

export class StoreResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  slug!: string;
  @ApiProperty()
  subdomain!: string;
  @ApiPropertyOptional({ type: String, nullable: true })
  customDomain!: string | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  logoUrl!: string | null;
  @ApiProperty({ enum: STORE_STATUSES })
  status!: StoreStatusValue;
  @ApiPropertyOptional({ type: String, nullable: true })
  deactivationReason!: string | null;
  @ApiProperty({ type: StoreOwnerDto })
  owner!: StoreOwnerDto;
  @ApiProperty({ format: "date-time" })
  createdAt!: string;
  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}
