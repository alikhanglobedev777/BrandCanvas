export interface SaveStoreAssetFileInput {
  storeId: string;
  category: "logo" | "favicon";
  extension: "png" | "webp";
  content: Buffer;
  mimeType: "image/png" | "image/webp";
  width: number;
  height: number;
  originalFilename: string;
}

export interface StoredStoreAssetFile {
  storageProvider: "local";
  storageKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: "image/png" | "image/webp";
  sizeBytes: number;
  width: number;
  height: number;
}

export abstract class StoreAssetStorage {
  abstract save(
    input: SaveStoreAssetFileInput,
  ): Promise<StoredStoreAssetFile>;

  abstract remove(storageKey: string): Promise<void>;
}
