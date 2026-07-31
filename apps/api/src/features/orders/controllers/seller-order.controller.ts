import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ActiveStoreGuard } from "../../../common/guards/active-store.guard";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { OrderListResponseDto, OrderResponseDto, SellerOrderQueryDto, UpdateOrderStatusDto, UpdateTrackingDto } from "../dto";
import { OrderPermissionGuard } from "../guards/order-permission.guard";
import { OrderService } from "../services/order.service";
@ApiTags("Seller Orders") @ApiCookieAuth("brandcanvas_access") @Roles("user") @UseGuards(ActiveStoreGuard, OrderPermissionGuard) @Controller("seller/orders")
export class SellerOrderController {
  constructor(private readonly service: OrderService) {}
  @Get() @ApiOkResponse({ type: OrderListResponseDto }) list(@CurrentUser() user: AuthenticatedUser, @Query() query: SellerOrderQueryDto) { return this.service.list(user.storeId!, query); }
  @Get(":orderId") @ApiOkResponse({ type: OrderResponseDto }) get(@CurrentUser() user: AuthenticatedUser, @Param("orderId") id: string) { return this.service.get(user.storeId!, id); }
  @Patch(":orderId/status") @UseGuards(CsrfGuard) @ApiOkResponse({ type: OrderResponseDto }) updateStatus(@CurrentUser() user: AuthenticatedUser, @Param("orderId") id: string, @Body() input: UpdateOrderStatusDto) { return this.service.status(user.storeId!, user.userId, id, input); }
  @Patch(":orderId/tracking") @UseGuards(CsrfGuard) @ApiOkResponse({ type: OrderResponseDto }) updateTracking(@CurrentUser() user: AuthenticatedUser, @Param("orderId") id: string, @Body() input: UpdateTrackingDto) { return this.service.tracking(user.storeId!, id, input); }
}
