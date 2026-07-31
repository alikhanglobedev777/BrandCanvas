import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ActiveStoreGuard } from "../../../common/guards/active-store.guard";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { OrderPermissionGuard } from "../../orders/guards/order-permission.guard";
import { AssignPlanDto, CreatePlanDto, PlanListDto, PlanResponseDto, PlatformAnalyticsDto, SellerAnalyticsDto, SubscriptionResponseDto, UsageResponseDto } from "../dto";
import { SubscriptionService } from "../services/subscription.service";

@ApiTags("Seller Subscription")
@ApiCookieAuth("brandcanvas_access")
@Roles("user")
@UseGuards(ActiveStoreGuard, OrderPermissionGuard)
@Controller("seller/subscription")
export class SellerSubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get("current")
  @ApiOkResponse({ type: SubscriptionResponseDto })
  current(@CurrentUser() user: AuthenticatedUser) {
    return this.service.current(user.storeId!);
  }

  @Get("usage")
  @ApiOkResponse({ type: UsageResponseDto })
  usage(@CurrentUser() user: AuthenticatedUser) {
    return this.service.usage(user.storeId!);
  }

  @Get("analytics")
  @ApiOkResponse({ type: SellerAnalyticsDto })
  analytics(@CurrentUser() user: AuthenticatedUser) {
    return this.service.sellerAnalytics(user.storeId!);
  }
}

@ApiTags("Platform Subscription")
@ApiCookieAuth("brandcanvas_access")
@Roles("super_admin")
@Controller("platform/subscription")
export class PlatformSubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get("plans")
  @ApiOkResponse({ type: PlanListDto })
  plans() {
    return this.service.listPlans();
  }

  @Post("plans")
  @UseGuards(CsrfGuard)
  @ApiCreatedResponse({ type: PlanResponseDto })
  createPlan(@Body() input: CreatePlanDto) {
    return this.service.createPlan(input);
  }

  @Post("assign")
  @UseGuards(CsrfGuard)
  @ApiCreatedResponse({ type: SubscriptionResponseDto })
  assign(@CurrentUser() user: AuthenticatedUser, @Body() input: AssignPlanDto) {
    return this.service.assignPlan(input, user.userId);
  }

  @Get("analytics")
  @ApiOkResponse({ type: PlatformAnalyticsDto })
  analytics() {
    return this.service.platformAnalytics();
  }
}
