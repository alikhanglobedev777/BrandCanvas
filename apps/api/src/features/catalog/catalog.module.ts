import { Module } from "@nestjs/common";
import { ActiveStoreGuard } from "../../common/guards/active-store.guard";
import { CatalogController } from "./controllers/catalog.controller";
import { CatalogManagementController } from "./controllers/catalog-management.controller";
import { InventoryManagementController } from "./controllers/inventory-management.controller";
import { ProductImageController } from "./controllers/product-image.controller";
import { CatalogRepository, DrizzleCatalogRepository } from "./repositories";
import {
  CatalogManagementRepository,
  DrizzleCatalogManagementRepository,
} from "./repositories";
import {
  CatalogManagementService,
  CatalogService,
  InventoryService,
  ProductImageService,
} from "./services";
import {
  DrizzleInventoryRepository,
  DrizzleProductImageRepository,
  InventoryRepository,
  ProductImageRepository,
} from "./repositories";
import { CatalogPermissionGuard } from "./guards";

@Module({
  controllers: [
    CatalogController,
    CatalogManagementController,
    ProductImageController,
    InventoryManagementController,
  ],
  providers: [
    ActiveStoreGuard,
    CatalogService,
    CatalogManagementService,
    ProductImageService,
    InventoryService,
    CatalogPermissionGuard,
    DrizzleCatalogRepository,
    DrizzleCatalogManagementRepository,
    DrizzleProductImageRepository,
    DrizzleInventoryRepository,
    { provide: CatalogRepository, useExisting: DrizzleCatalogRepository },
    {
      provide: CatalogManagementRepository,
      useExisting: DrizzleCatalogManagementRepository,
    },
    {
      provide: ProductImageRepository,
      useExisting: DrizzleProductImageRepository,
    },
    {
      provide: InventoryRepository,
      useExisting: DrizzleInventoryRepository,
    },
  ],
})
export class CatalogModule {}
