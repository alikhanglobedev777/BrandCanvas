import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  InventoryItemEntity,
  InventoryReservationEntity,
} from "../entities";
import { InventoryRepository } from "../repositories";
import { InventoryService } from "./inventory.service";

class TestInventoryRepository extends InventoryRepository {
  list = vi.fn<InventoryRepository["list"]>();
  listProduct = vi.fn<InventoryRepository["listProduct"]>();
  listMovements = vi.fn<InventoryRepository["listMovements"]>();
  adjust = vi.fn<InventoryRepository["adjust"]>();
  updateThreshold = vi.fn<InventoryRepository["updateThreshold"]>();
  reserve = vi.fn<InventoryRepository["reserve"]>();
  transitionReservation = vi.fn<InventoryRepository["transitionReservation"]>();
}

const now = new Date("2026-07-15T12:00:00.000Z");
const item: InventoryItemEntity = {
  id: "inventory-a",
  storeId: "store-a",
  productId: "product-a",
  productName: "Canvas Tote",
  productArchivedAt: null,
  variantId: "variant-a",
  variantTitle: "Default",
  variantArchivedAt: null,
  variantIsActive: true,
  sku: "TOTE-A",
  stockQuantity: 10,
  reservedQuantity: 2,
  lowStockThreshold: 3,
  createdAt: now,
  updatedAt: now,
};
const reservation: InventoryReservationEntity = {
  id: "reservation-a",
  storeId: "store-a",
  productId: "product-a",
  variantId: "variant-a",
  inventoryItemId: "inventory-a",
  quantity: 2,
  status: "active",
  referenceType: "checkout",
  referenceId: "11111111-1111-4111-8111-111111111111",
  idempotencyKey: "checkout-1111",
  expiresAt: new Date("2099-07-15T12:15:00.000Z"),
  releasedAt: null,
  createdAt: now,
  updatedAt: now,
};

describe("InventoryService", () => {
  let repository: TestInventoryRepository;
  let service: InventoryService;

  beforeEach(() => {
    repository = new TestInventoryRepository();
    service = new InventoryService(repository);
  });

  it.each([
    ["increase", 5, 15],
    ["decrease", 3, 7],
    ["set", 8, 8],
  ] as const)("supports %s adjustments", async (operation, quantity, stock) => {
    repository.adjust.mockResolvedValue({
      status: "success",
      item: { ...item, stockQuantity: stock },
    });
    const result = await service.adjust("store-a", "user-a", item.id, {
      operation,
      quantity,
      reason: "Cycle count correction",
    });
    expect(repository.adjust).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: "store-a", operation, quantity }),
    );
    expect(result.stockQuantity).toBe(stock);
    expect(result.availableQuantity).toBe(stock - item.reservedQuantity);
  });

  it("rejects a zero-sized relative adjustment", async () => {
    await expect(
      service.adjust("store-a", "user-a", item.id, {
        operation: "decrease",
        quantity: 0,
        reason: "Cycle count correction",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.adjust).not.toHaveBeenCalled();
  });

  it("prevents negative or reserved-stock violations", async () => {
    repository.adjust.mockResolvedValue({ status: "insufficient_stock" });
    await expect(
      service.adjust("store-a", "user-a", item.id, {
        operation: "set",
        quantity: 1,
        reason: "Cycle count correction",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("passes trusted store scope and idempotency to the repository", async () => {
    repository.adjust.mockResolvedValue({ status: "idempotent", item });
    await service.adjust("store-a", "user-a", item.id, {
      operation: "increase",
      quantity: 2,
      reason: " Supplier delivery ",
      idempotencyKey: "delivery-1234",
    });
    expect(repository.adjust).toHaveBeenCalledWith({
      storeId: "store-a",
      actorUserId: "user-a",
      inventoryItemId: item.id,
      operation: "increase",
      quantity: 2,
      reason: "Supplier delivery",
      idempotencyKey: "delivery-1234",
    });
  });

  it("returns a stable conflict when a concurrent adjustment loses its conditional update", async () => {
    repository.adjust.mockResolvedValue({ status: "conflict" });
    await expect(
      service.adjust("store-a", "user-a", item.id, {
        operation: "increase",
        quantity: 1,
        reason: "Concurrent delivery",
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: "INVENTORY_CONFLICT" }),
    });
  });

  it("creates a reservation and returns updated availability", async () => {
    repository.reserve.mockResolvedValue({
      status: "success",
      item: { ...item, reservedQuantity: 4 },
      reservation,
    });
    const result = await service.reserve("store-a", "user-a", item.id, {
      quantity: 2,
      referenceType: "checkout",
      referenceId: reservation.referenceId,
      idempotencyKey: reservation.idempotencyKey,
      expiresAt: reservation.expiresAt.toISOString(),
    });
    expect(result.inventory.availableQuantity).toBe(6);
    expect(result.reservation.status).toBe("active");
  });

  it("rejects reservations larger than available stock", async () => {
    repository.reserve.mockResolvedValue({ status: "insufficient_stock" });
    await expect(
      service.reserve("store-a", "user-a", item.id, {
        quantity: 20,
        referenceType: "checkout",
        referenceId: reservation.referenceId,
        idempotencyKey: "checkout-2222",
        expiresAt: reservation.expiresAt.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("releases a reservation once", async () => {
    repository.transitionReservation.mockResolvedValue({
      status: "success",
      item,
      reservation: { ...reservation, status: "released", releasedAt: now },
    });
    const result = await service.transitionReservation(
      "store-a",
      "user-a",
      reservation.id,
      "release",
    );
    expect(result.reservation.status).toBe("released");
  });

  it("protects duplicate reservation processing", async () => {
    repository.transitionReservation.mockResolvedValue({
      status: "already_processed",
    });
    await expect(
      service.transitionReservation(
        "store-a",
        "user-a",
        reservation.id,
        "release",
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("does not expire an active reservation early", async () => {
    repository.transitionReservation.mockResolvedValue({
      status: "not_expired",
    });
    await expect(
      service.transitionReservation(
        "store-a",
        "user-a",
        reservation.id,
        "expire",
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("does not disclose another store's inventory", async () => {
    repository.listProduct.mockResolvedValue(null);
    await expect(
      service.getProduct("store-b", "product-a"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.listProduct).toHaveBeenCalledWith("store-b", "product-a");
  });
});
