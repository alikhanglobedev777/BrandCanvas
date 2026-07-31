import { Module } from "@nestjs/common";
import { StorefrontController } from "./controllers/storefront.controller";
import { DrizzleStorefrontRepository, StorefrontRepository } from "./repositories";
import { StorefrontService } from "./services";
@Module({ controllers: [StorefrontController], providers: [StorefrontService, DrizzleStorefrontRepository, { provide: StorefrontRepository, useExisting: DrizzleStorefrontRepository }], exports: [StorefrontService, StorefrontRepository] })
export class StorefrontModule {}
