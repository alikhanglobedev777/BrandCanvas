import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ActiveStoreGuard } from "../../../common/guards/active-store.guard";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import {
  CreateProductDto,
  ProductListResponseDto,
  ProductQueryDto,
  ProductResponseDto,
} from "../dto";
import { CatalogService } from "../services";
import { CatalogPermissionGuard } from "../guards";

@ApiTags("Seller Catalog")
@ApiCookieAuth("brandcanvas_access")
@Roles("user")
@UseGuards(ActiveStoreGuard, CatalogPermissionGuard, CsrfGuard)
@Controller("seller")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("products")
  @ApiOperation({
    summary:
      "List products and current inventory for the authenticated seller store",
  })
  @ApiOkResponse({ type: ProductListResponseDto })
  findMany(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProductQueryDto,
  ): Promise<ProductListResponseDto> {
    return this.catalogService.findMany(user.storeId!, query);
  }

  @Post("products")
  @ApiOperation({
    summary: "Create a product, default variant, and inventory item",
  })
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.catalogService.create(user.storeId!, user.userId, input);
  }
}
