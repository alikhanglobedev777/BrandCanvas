import { describe, expect, it } from "vitest";
import {
  formatMovementContext,
  getInventoryListViewState,
  validateAdjustment,
} from "./inventory-view";

describe("inventory view model", () => {
  it("represents loading, generated API errors, empty, and ready list states", () => {
    expect(
      getInventoryListViewState({ pending: true, error: false, itemCount: 0 }),
    ).toBe("loading");
    expect(
      getInventoryListViewState({ pending: false, error: true, itemCount: 0 }),
    ).toBe("error");
    expect(
      getInventoryListViewState({ pending: false, error: false, itemCount: 0 }),
    ).toBe("empty");
    expect(
      getInventoryListViewState({ pending: false, error: false, itemCount: 1 }),
    ).toBe("ready");
  });

  it("validates relative, exact, and reason adjustment fields", () => {
    expect(
      validateAdjustment({ operation: "decrease", quantity: 0, reason: "x" }),
    ).toEqual({
      quantity: "Quantity must be a whole number of at least 1.",
      reason: "Reason must contain at least 3 characters.",
    });
    expect(
      validateAdjustment({ operation: "set", quantity: 0, reason: "Counted" }),
    ).toEqual({
      quantity: null,
      reason: null,
    });
  });

  it("renders movement actor and reference context", () => {
    expect(
      formatMovementContext({
        id: "movement-a",
        movementType: "reservation",
        quantityDelta: 0,
        stockBefore: 4,
        stockAfter: 4,
        reservedBefore: 0,
        reservedAfter: 1,
        reason: "Checkout",
        referenceType: "reservation",
        referenceId: "reservation-a",
        actorName: "Seller Admin",
        metadata: {},
        createdAt: "2026-07-15T12:00:00.000Z",
      }),
    ).toBe("Seller Admin · reservation: reservation-a");
  });
});
