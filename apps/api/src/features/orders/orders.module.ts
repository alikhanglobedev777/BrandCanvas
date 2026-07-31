import { Module } from "@nestjs/common";
import { CartModule } from "../cart";
import { StorefrontModule } from "../storefront";
import { OrderController } from "./controllers/order.controller";
import { SellerOrderController } from "./controllers/seller-order.controller";
import { OrderPermissionGuard } from "./guards/order-permission.guard";
import { DrizzleOrderRepository, OrderRepository } from "./repositories";
import { OrderService } from "./services/order.service";
@Module({ imports: [CartModule, StorefrontModule], controllers: [OrderController, SellerOrderController], providers: [OrderService, OrderPermissionGuard, DrizzleOrderRepository, { provide: OrderRepository, useExisting: DrizzleOrderRepository }], exports: [OrderService, OrderRepository] })
export class OrdersModule {}
