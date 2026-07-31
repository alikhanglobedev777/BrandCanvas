import type { CheckoutResponseDto, SaveCheckoutAddressDto } from "../dto";
export abstract class CheckoutRepository {
 abstract start(input:{storeId:string;storeSlug:string;guestTokenHash:string;idempotencyKey:string;expiresAt:Date}):Promise<CheckoutResponseDto|"cart_empty"|"insufficient_stock">;
 abstract get(input:{storeId:string;storeSlug:string;guestTokenHash:string;checkoutId:string}):Promise<CheckoutResponseDto|null>;
 abstract saveAddress(input:{storeId:string;storeSlug:string;guestTokenHash:string;checkoutId:string;address:SaveCheckoutAddressDto}):Promise<CheckoutResponseDto|null>;
 abstract cancel(input:{storeId:string;storeSlug:string;guestTokenHash:string;checkoutId:string}):Promise<CheckoutResponseDto|null>;
}
