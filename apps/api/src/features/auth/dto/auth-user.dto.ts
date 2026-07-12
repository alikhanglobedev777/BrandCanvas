import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AuthUserDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "Muhammad Ali" })
  name!: string;

  @ApiProperty({ example: "admin@brandcanvas.local" })
  email!: string;

  @ApiProperty({ enum: ["super_admin", "user"] })
  platformRole!: "super_admin" | "user";

  @ApiPropertyOptional({ format: "uuid" })
  storeId?: string;

  @ApiPropertyOptional({ enum: ["pending", "active", "inactive", "suspended", "archived"] })
  storeStatus?: "pending" | "active" | "inactive" | "suspended" | "archived";

  @ApiProperty()
  mustChangePassword!: boolean;
}
