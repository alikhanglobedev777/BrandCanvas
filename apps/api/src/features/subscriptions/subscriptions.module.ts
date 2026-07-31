import { Module } from "@nestjs/common";
import { SellerSubscriptionController, PlatformSubscriptionController } from "./controllers/subscription.controller";
import { DrizzleSubscriptionRepository } from "./repositories/drizzle-subscription.repository";
import { SubscriptionRepository } from "./repositories/subscription.repository";
import { SubscriptionService } from "./services/subscription.service";

@Module({
  controllers: [SellerSubscriptionController, PlatformSubscriptionController],
  providers: [
    SubscriptionService,
    DrizzleSubscriptionRepository,
    { provide: SubscriptionRepository, useExisting: DrizzleSubscriptionRepository },
  ],
  exports: [SubscriptionService, SubscriptionRepository],
})
export class SubscriptionsModule {}
