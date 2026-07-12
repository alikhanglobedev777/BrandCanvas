import { Module } from "@nestjs/common";
import { ActiveStoreGuard } from "../../common/guards/active-store.guard";
import { CatalogController } from "./controllers/catalog.controller";
import { CatalogManagementController } from "./controllers/catalog-management.controller";
import { CatalogRepository, DrizzleCatalogRepository } from "./repositories";
import {
  CatalogManagementRepository,
  DrizzleCatalogManagementRepository,
} from "./repositories";
import { CatalogManagementService, CatalogService } from "./services";
import { CatalogPermissionGuard } from "./guards";

@Module({
  controllers: [CatalogController, CatalogManagementController],
  providers: [
    ActiveStoreGuard,
    CatalogService,
    CatalogManagementService,
    CatalogPermissionGuard,
    DrizzleCatalogRepository,
    DrizzleCatalogManagementRepository,
    { provide: CatalogRepository, useExisting: DrizzleCatalogRepository },
    {
      provide: CatalogManagementRepository,
      useExisting: DrizzleCatalogManagementRepository,
    },
  ],
})
export class CatalogModule {}
