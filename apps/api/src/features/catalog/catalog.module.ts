import { Module } from "@nestjs/common";
import { ActiveStoreGuard } from "../../common/guards/active-store.guard";
import { CatalogController } from "./controllers/catalog.controller";
import { CatalogRepository, DrizzleCatalogRepository } from "./repositories";
import { CatalogService } from "./services";

@Module({
  controllers: [CatalogController],
  providers: [
    ActiveStoreGuard,
    CatalogService,
    DrizzleCatalogRepository,
    { provide: CatalogRepository, useExisting: DrizzleCatalogRepository },
  ],
})
export class CatalogModule {}
