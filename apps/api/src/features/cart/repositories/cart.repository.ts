import type { CartResponseDto } from "../dto";
export abstract class CartRepository {
  abstract getOrCreate(input: { storeId: string; storeSlug: string; currency: string; guestTokenHash: string; expiresAt: Date }): Promise<CartResponseDto>;
  abstract addItem(input: { storeId: string; storeSlug: string; currency: string; guestTokenHash: string; expiresAt: Date; productId: string; variantId: string; quantity: number }): Promise<CartResponseDto | "product_not_found" | "insufficient_stock">;
  abstract updateItem(input: { storeId: string; storeSlug: string; guestTokenHash: string; itemId: string; quantity: number }): Promise<CartResponseDto | "not_found" | "insufficient_stock">;
  abstract removeItem(input: { storeId: string; storeSlug: string; guestTokenHash: string; itemId: string }): Promise<CartResponseDto | "not_found">;
  abstract clear(input: { storeId: string; storeSlug: string; guestTokenHash: string }): Promise<CartResponseDto>;
}
