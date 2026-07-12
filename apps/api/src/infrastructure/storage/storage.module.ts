import { Global, Module } from "@nestjs/common";
import { LocalStoreAssetStorage } from "./local-store-asset-storage";
import { StoreAssetStorage } from "./store-asset-storage";

@Global()
@Module({
  providers: [
    LocalStoreAssetStorage,
    {
      provide: StoreAssetStorage,
      useExisting: LocalStoreAssetStorage,
    },
  ],
  exports: [StoreAssetStorage],
})
export class StorageModule {}
