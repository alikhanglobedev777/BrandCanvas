import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CartService } from "../../cart/services/cart.service";
import { StorefrontService } from "../../storefront/services";
import type { PlaceOrderDto, SellerOrderQueryDto, TrackOrderQueryDto, UpdateOrderStatusDto, UpdateTrackingDto } from "../dto";
import { OrderRepository } from "../repositories";
@Injectable()
export class OrderService {
  constructor(private readonly repository: OrderRepository, private readonly storefront: StorefrontService, private readonly cart: CartService) {}
  async place(host: string | undefined, input: PlaceOrderDto, token: string) {
    const store = await this.storefront.resolve(host, input);
    const result = await this.repository.place({ storeId: store.storeId, storeSlug: store.slug, guestTokenHash: this.cart.hash(token), checkoutId: input.checkoutId, idempotencyKey: input.idempotencyKey, notes: input.notes, paymentMethod: input.paymentMethod });
    if (result === "checkout_not_found") throw new NotFoundException({ code: "CHECKOUT_NOT_FOUND", message: "Checkout not found." });
    if (result === "checkout_not_ready") throw new BadRequestException({ code: "CHECKOUT_NOT_READY", message: "Complete the checkout address and contact details first." });
    if (result === "insufficient_stock") throw new ConflictException({ code: "INSUFFICIENT_STOCK", message: "Stock changed before the order was placed." });
    return result;
  }
  async track(query: TrackOrderQueryDto) { const order = await this.repository.track({ reference: query.reference, email: query.email }); if (!order) throw new NotFoundException({ code: "ORDER_NOT_FOUND", message: "Order not found." }); return order; }
  list(storeId: string, query: SellerOrderQueryDto) { return this.repository.list(storeId, query); }
  async get(storeId: string, id: string) { const order = await this.repository.get(storeId, id); if (!order) throw new NotFoundException({ code: "ORDER_NOT_FOUND", message: "Order not found." }); return order; }
  async status(storeId: string, actorUserId: string, id: string, input: UpdateOrderStatusDto) { const result = await this.repository.updateStatus({ storeId, orderId: id, actorUserId, status: input.status, note: input.note }); if (result === "not_found") throw new NotFoundException({ code: "ORDER_NOT_FOUND", message: "Order not found." }); if (result === "invalid_transition") throw new ConflictException({ code: "ORDER_STATUS_TRANSITION_INVALID", message: "This order status transition is not allowed." }); return result; }
  async tracking(storeId: string, id: string, input: UpdateTrackingDto) { const result = await this.repository.tracking({ storeId, orderId: id, ...input }); if (!result) throw new NotFoundException({ code: "ORDER_NOT_FOUND", message: "Order not found." }); return result; }
}
