import { Module } from "@nestjs/common";
import { AdminStoreCustomizationController } from "./controllers/admin-store-customization.controller";
import { PublicStoreCustomizationController } from "./controllers/public-store-customization.controller";
import { SellerStoreCustomizationController } from "./controllers/seller-store-customization.controller";
import { StoreCustomizationAccessGuard } from "./guards";
import {
  DrizzleStoreCustomizationRepository,
  StoreCustomizationRepository,
} from "./repositories";
import { StoreCustomizationService } from "./services";
import { StoreCustomizationPolicy } from "./policies";

@Module({
  controllers: [
    SellerStoreCustomizationController,
    AdminStoreCustomizationController,
    PublicStoreCustomizationController,
  ],
  providers: [
    StoreCustomizationService,
    StoreCustomizationAccessGuard,
    StoreCustomizationPolicy,
    DrizzleStoreCustomizationRepository,
    {
      provide: StoreCustomizationRepository,
      useExisting: DrizzleStoreCustomizationRepository,
    },
  ],
  exports: [StoreCustomizationService],
})
export class StoreCustomizationModule {}
