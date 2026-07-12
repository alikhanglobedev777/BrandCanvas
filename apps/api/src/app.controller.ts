import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";

class HealthResponseDto {
  @ApiProperty({ example: "ok" })
  status!: string;

  @ApiProperty({ example: "brandcanvas-api" })
  service!: string;

  @ApiProperty({ example: "2026-07-11T00:00:00.000Z" })
  timestamp!: string;
}

@ApiTags("Health")
@Controller()
export class AppController {
  @Get("health")
  @ApiOperation({ summary: "Check API health" })
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    return {
      status: "ok",
      service: "brandcanvas-api",
      timestamp: new Date().toISOString(),
    };
  }
}
