import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ActiveStoreGuard } from "../../../common/guards/active-store.guard";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import {
  InventoryAdjustmentRequestDto,
  InventoryItemResponseDto,
  InventoryListResponseDto,
  InventoryMovementListResponseDto,
  InventoryMovementQueryDto,
  InventoryQueryDto,
  InventoryReservationOperationResponseDto,
  ProductInventoryResponseDto,
  ReserveInventoryDto,
  UpdateLowStockThresholdDto,
} from "../dto";
import { CatalogPermissionGuard, RequireCatalogPermission } from "../guards";
import { InventoryService } from "../services";

@ApiTags("Seller Inventory")
@ApiCookieAuth("brandcanvas_access")
@Roles("user")
@RequireCatalogPermission("inventory")
@UseGuards(ActiveStoreGuard, CatalogPermissionGuard, CsrfGuard)
@Controller("seller/inventory")
export class InventoryManagementController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  @ApiOkResponse({ type: InventoryListResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: InventoryQueryDto,
  ) {
    return this.service.list(user.storeId!, query);
  }

  @Get("products/:productId")
  @ApiOkResponse({ type: ProductInventoryResponseDto })
  getProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
  ) {
    return this.service.getProduct(user.storeId!, productId);
  }

  @Get(":inventoryItemId/movements")
  @ApiOkResponse({ type: InventoryMovementListResponseDto })
  listMovements(
    @CurrentUser() user: AuthenticatedUser,
    @Param("inventoryItemId", ParseUUIDPipe) inventoryItemId: string,
    @Query() query: InventoryMovementQueryDto,
  ) {
    return this.service.listMovements(user.storeId!, inventoryItemId, query);
  }

  @Post(":inventoryItemId/adjustments")
  @ApiCreatedResponse({ type: InventoryItemResponseDto })
  adjust(
    @CurrentUser() user: AuthenticatedUser,
    @Param("inventoryItemId", ParseUUIDPipe) inventoryItemId: string,
    @Body() input: InventoryAdjustmentRequestDto,
  ) {
    return this.service.adjust(
      user.storeId!,
      user.userId,
      inventoryItemId,
      input,
    );
  }

  @Patch(":inventoryItemId/threshold")
  @ApiOkResponse({ type: InventoryItemResponseDto })
  updateThreshold(
    @CurrentUser() user: AuthenticatedUser,
    @Param("inventoryItemId", ParseUUIDPipe) inventoryItemId: string,
    @Body() input: UpdateLowStockThresholdDto,
  ) {
    return this.service.updateThreshold(
      user.storeId!,
      user.userId,
      inventoryItemId,
      input,
    );
  }

  @Post(":inventoryItemId/reservations")
  @ApiCreatedResponse({ type: InventoryReservationOperationResponseDto })
  reserve(
    @CurrentUser() user: AuthenticatedUser,
    @Param("inventoryItemId", ParseUUIDPipe) inventoryItemId: string,
    @Body() input: ReserveInventoryDto,
  ) {
    return this.service.reserve(
      user.storeId!,
      user.userId,
      inventoryItemId,
      input,
    );
  }

  @Post("reservations/:reservationId/release")
  @ApiCreatedResponse({ type: InventoryReservationOperationResponseDto })
  release(
    @CurrentUser() user: AuthenticatedUser,
    @Param("reservationId", ParseUUIDPipe) reservationId: string,
  ) {
    return this.transition(user, reservationId, "release");
  }

  @Post("reservations/:reservationId/expire")
  @ApiCreatedResponse({ type: InventoryReservationOperationResponseDto })
  expire(
    @CurrentUser() user: AuthenticatedUser,
    @Param("reservationId", ParseUUIDPipe) reservationId: string,
  ) {
    return this.transition(user, reservationId, "expire");
  }

  @Post("reservations/:reservationId/cancel")
  @ApiCreatedResponse({ type: InventoryReservationOperationResponseDto })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("reservationId", ParseUUIDPipe) reservationId: string,
  ) {
    return this.transition(user, reservationId, "cancel");
  }

  @Post("reservations/:reservationId/convert")
  @ApiCreatedResponse({ type: InventoryReservationOperationResponseDto })
  convert(
    @CurrentUser() user: AuthenticatedUser,
    @Param("reservationId", ParseUUIDPipe) reservationId: string,
  ) {
    return this.transition(user, reservationId, "convert");
  }

  private transition(
    user: AuthenticatedUser,
    reservationId: string,
    transition: "release" | "expire" | "cancel" | "convert",
  ) {
    return this.service.transitionReservation(
      user.storeId!,
      user.userId,
      reservationId,
      transition,
    );
  }
}
