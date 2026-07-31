import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { validateEnvironment } from "./config/env.schema";
import { AccessTokenGuard } from "./common/guards/access-token.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { DatabaseModule } from "./infrastructure/database";
import { StorageModule } from "./infrastructure/storage";
import { AuthModule } from "./features/auth";
import { StoresModule } from "./features/stores";
import { CatalogModule } from "./features/catalog";
import { StoreCustomizationModule } from "./features/store-customization";
import { StorefrontModule } from "./features/storefront";
import { CartModule } from "./features/cart";
import { CheckoutModule } from "./features/checkout";
import { OrdersModule } from "./features/orders";
import { CustomersModule } from "./features/customers";
import { PromotionsModule } from "./features/promotions";
import { MessagingModule } from "./features/messaging";
import { PaymentsModule } from "./features/payments";
import { SubscriptionsModule } from "./features/subscriptions";
import { NotificationsModule } from "./features/notifications";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    StorageModule,
    AuthModule,
    StoresModule,
    CatalogModule,
    StoreCustomizationModule,
    StorefrontModule,
    CartModule,
    CheckoutModule,
    OrdersModule,
    CustomersModule,
    PromotionsModule,
    MessagingModule,
    PaymentsModule,
    SubscriptionsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
