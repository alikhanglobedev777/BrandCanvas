import { Module } from "@nestjs/common";
import { AuthModule } from "../auth";
import { StoreController } from "./controllers/store.controller";
import { DrizzleStoreRepository, StoreRepository } from "./repositories";
import { StoreService } from "./services";

@Module({
  imports: [AuthModule],
  controllers: [StoreController],
  providers: [StoreService, DrizzleStoreRepository, { provide: StoreRepository, useExisting: DrizzleStoreRepository }],
  exports: [StoreService],
})
export class StoresModule {}
