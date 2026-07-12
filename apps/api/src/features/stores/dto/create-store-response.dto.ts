import { ApiProperty } from "@nestjs/swagger";
import { StoreResponseDto } from "./store-response.dto";

export class CreateStoreResponseDto {
  @ApiProperty({ type: StoreResponseDto })
  store!: StoreResponseDto;

  @ApiProperty({ description: "Shown once so the super admin can hand it to the seller." })
  temporaryPassword!: string;
}
