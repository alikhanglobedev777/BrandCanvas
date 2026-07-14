import type {
  InventoryAdjustmentRequestDto,
  InventoryMovementResponseDto,
} from "@brandcanvas/contracts";

export type InventoryListViewState = "loading" | "error" | "empty" | "ready";

export function getInventoryListViewState(input: {
  pending: boolean;
  error: boolean;
  itemCount: number;
}): InventoryListViewState {
  if (input.pending) return "loading";
  if (input.error) return "error";
  if (input.itemCount === 0) return "empty";
  return "ready";
}

export function validateAdjustment(
  input: InventoryAdjustmentRequestDto,
): Record<"quantity" | "reason", string | null> {
  const minimum = input.operation === "set" ? 0 : 1;
  return {
    quantity:
      Number.isInteger(input.quantity) && input.quantity >= minimum
        ? null
        : `Quantity must be a whole number of at least ${minimum}.`,
    reason:
      input.reason.trim().length >= 3
        ? null
        : "Reason must contain at least 3 characters.",
  };
}

export function formatMovementContext(movement: InventoryMovementResponseDto) {
  const actor = movement.actorName ?? "System";
  return movement.referenceType
    ? `${actor} · ${movement.referenceType}: ${movement.referenceId ?? "unknown"}`
    : actor;
}
