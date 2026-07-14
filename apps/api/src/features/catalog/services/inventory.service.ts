import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  InventoryAdjustmentRequestDto,
  InventoryListResponseDto,
  InventoryMovementListResponseDto,
  InventoryMovementQueryDto,
  InventoryQueryDto,
  InventoryReservationOperationResponseDto,
  ProductInventoryResponseDto,
  ReserveInventoryDto,
  UpdateLowStockThresholdDto,
} from "../dto";
import { InventoryMapper } from "../mappers";
import {
  InventoryRepository,
  type InventoryMutationResult,
  type ReservationMutationResult,
} from "../repositories/inventory.repository";

@Injectable()
export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  async list(
    storeId: string,
    query: InventoryQueryDto,
  ): Promise<InventoryListResponseDto> {
    const result = await this.repository.list({ storeId, ...query });
    return {
      items: result.items.map(InventoryMapper.item),
      total: result.total,
      totalPages: Math.ceil(result.total / query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
    };
  }

  async getProduct(
    storeId: string,
    productId: string,
  ): Promise<ProductInventoryResponseDto> {
    const items = await this.repository.listProduct(storeId, productId);
    if (!items) this.notFound("PRODUCT_NOT_FOUND", "Product not found.");
    return { productId, items: items.map(InventoryMapper.item) };
  }

  async listMovements(
    storeId: string,
    inventoryItemId: string,
    query: InventoryMovementQueryDto,
  ): Promise<InventoryMovementListResponseDto> {
    const result = await this.repository.listMovements({
      storeId,
      inventoryItemId,
      page: query.page,
      pageSize: query.pageSize,
      movementType: query.movementType,
    });
    if (!result) this.inventoryNotFound();
    return {
      items: result.items.map(InventoryMapper.movement),
      total: result.total,
      totalPages: Math.ceil(result.total / query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
    };
  }

  async adjust(
    storeId: string,
    actorUserId: string,
    inventoryItemId: string,
    input: InventoryAdjustmentRequestDto,
  ) {
    if (input.operation !== "set" && input.quantity === 0)
      throw new BadRequestException({
        code: "INVENTORY_QUANTITY_INVALID",
        message: "Increase and decrease quantities must be greater than zero.",
      });
    const result = await this.repository.adjust({
      storeId,
      actorUserId,
      inventoryItemId,
      ...input,
      reason: input.reason.trim(),
    });
    return InventoryMapper.item(this.requireInventoryMutation(result));
  }

  async updateThreshold(
    storeId: string,
    actorUserId: string,
    inventoryItemId: string,
    input: UpdateLowStockThresholdDto,
  ) {
    const result = await this.repository.updateThreshold({
      storeId,
      actorUserId,
      inventoryItemId,
      ...input,
      reason: input.reason.trim(),
    });
    return InventoryMapper.item(this.requireInventoryMutation(result));
  }

  async reserve(
    storeId: string,
    actorUserId: string,
    inventoryItemId: string,
    input: ReserveInventoryDto,
  ): Promise<InventoryReservationOperationResponseDto> {
    const expiresAt = new Date(input.expiresAt);
    if (expiresAt <= new Date())
      throw new BadRequestException({
        code: "RESERVATION_EXPIRY_INVALID",
        message: "Reservation expiry must be in the future.",
      });
    return this.mapReservation(
      await this.repository.reserve({
        storeId,
        actorUserId,
        inventoryItemId,
        quantity: input.quantity,
        referenceType: input.referenceType.trim(),
        referenceId: input.referenceId,
        idempotencyKey: input.idempotencyKey,
        expiresAt,
      }),
    );
  }

  async transitionReservation(
    storeId: string,
    actorUserId: string,
    reservationId: string,
    transition: "release" | "expire" | "cancel" | "convert",
  ): Promise<InventoryReservationOperationResponseDto> {
    return this.mapReservation(
      await this.repository.transitionReservation({
        storeId,
        actorUserId,
        reservationId,
        transition,
        reason: `Reservation ${transition}`,
      }),
    );
  }

  private requireInventoryMutation(result: InventoryMutationResult) {
    if (result.status === "success" || result.status === "idempotent")
      return result.item;
    if (result.status === "not_found") this.inventoryNotFound();
    if (result.status === "insufficient_stock") this.insufficientStock();
    if (result.status === "unavailable")
      throw new ConflictException({
        code: "INVENTORY_UNAVAILABLE",
        message:
          "Inventory for an archived or inactive variant cannot be changed.",
      });
    this.conflict();
  }

  private mapReservation(
    result: ReservationMutationResult,
  ): InventoryReservationOperationResponseDto {
    if (result.status === "success" || result.status === "idempotent")
      return {
        inventory: InventoryMapper.item(result.item),
        reservation: InventoryMapper.reservation(result.reservation),
      };
    if (result.status === "not_found")
      this.notFound(
        "RESERVATION_NOT_FOUND",
        "Reservation or inventory not found.",
      );
    if (result.status === "insufficient_stock") this.insufficientStock();
    if (result.status === "already_processed")
      throw new ConflictException({
        code: "RESERVATION_ALREADY_PROCESSED",
        message: "This reservation has already been processed.",
      });
    if (result.status === "not_expired")
      throw new ConflictException({
        code: "RESERVATION_NOT_EXPIRED",
        message: "This reservation has not expired yet.",
      });
    if (result.status === "unavailable")
      throw new ConflictException({
        code: "INVENTORY_UNAVAILABLE",
        message: "Inventory is not available for reservation.",
      });
    this.conflict();
  }

  private inventoryNotFound(): never {
    this.notFound("INVENTORY_NOT_FOUND", "Inventory item not found.");
  }

  private insufficientStock(): never {
    throw new ConflictException({
      code: "INSUFFICIENT_STOCK",
      message: "There is not enough available inventory for this operation.",
    });
  }

  private conflict(): never {
    throw new ConflictException({
      code: "INVENTORY_CONFLICT",
      message: "Inventory changed concurrently. Refresh and try again.",
    });
  }

  private notFound(code: string, message: string): never {
    throw new NotFoundException({ code, message });
  }
}
