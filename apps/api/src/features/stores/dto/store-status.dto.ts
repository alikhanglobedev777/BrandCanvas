import { ApiProperty } from "@nestjs/swagger";

export const STORE_STATUSES = ["pending", "active", "inactive", "suspended", "archived"] as const;
export type StoreStatusValue = (typeof STORE_STATUSES)[number];

export class StoreStatusCountDto {
  @ApiProperty()
  total!: number;
  @ApiProperty()
  active!: number;
  @ApiProperty()
  pending!: number;
  @ApiProperty()
  inactive!: number;
  @ApiProperty()
  suspended!: number;
  @ApiProperty()
  archived!: number;
}
