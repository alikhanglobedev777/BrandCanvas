import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { CreateStoreDto, CreateStoreResponseDto, StoreListResponseDto, StoreQueryDto, StoreResponseDto, StoreStatusCountDto, UpdateStoreStatusDto } from "../dto";
import { StoreService } from "../services";

@ApiTags("Stores")
@ApiCookieAuth("brandcanvas_access")
@Roles("super_admin")
@Controller("admin/stores")
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get("summary")
  @ApiOperation({ summary: "Get store counts for the super-admin dashboard" })
  @ApiOkResponse({ type: StoreStatusCountDto })
  getSummary(): Promise<StoreStatusCountDto> {
    return this.storeService.getSummary();
  }

  @Get()
  @ApiOperation({ summary: "List stores" })
  @ApiOkResponse({ type: StoreListResponseDto })
  findMany(@Query() query: StoreQueryDto): Promise<StoreListResponseDto> {
    return this.storeService.findMany(query);
  }

  @Get(":storeId")
  @ApiOperation({ summary: "Get one store" })
  @ApiOkResponse({ type: StoreResponseDto })
  findOne(@Param("storeId", ParseUUIDPipe) storeId: string): Promise<StoreResponseDto> {
    return this.storeService.findOne(storeId);
  }

  @UseGuards(CsrfGuard)
  @Post()
  @ApiOperation({ summary: "Create a seller account and provision its store" })
  @ApiCreatedResponse({ type: CreateStoreResponseDto })
  create(@Body() body: CreateStoreDto): Promise<CreateStoreResponseDto> {
    return this.storeService.create(body);
  }

  @UseGuards(CsrfGuard)
  @Patch(":storeId/status")
  @ApiOperation({ summary: "Activate, deactivate, suspend, or archive a store" })
  @ApiOkResponse({ type: StoreResponseDto })
  updateStatus(
    @Param("storeId", ParseUUIDPipe) storeId: string,
    @Body() body: UpdateStoreStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StoreResponseDto> {
    return this.storeService.updateStatus(storeId, body, user.userId);
  }
}
