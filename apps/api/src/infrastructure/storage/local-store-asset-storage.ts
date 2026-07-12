import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppEnvironment } from "../../config/env.schema";
import {
  StoreAssetStorage,
  type SaveStoreAssetFileInput,
  type StoredStoreAssetFile,
} from "./store-asset-storage";

@Injectable()
export class LocalStoreAssetStorage extends StoreAssetStorage {
  private readonly root: string;
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService<AppEnvironment, true>) {
    super();
    this.root = path.resolve(
      process.cwd(),
      config.get("STORE_ASSET_STORAGE_ROOT", { infer: true }),
    );
    this.publicBaseUrl = config
      .get("STORE_ASSET_PUBLIC_BASE_URL", { infer: true })
      .replace(/\/+$/, "");
  }

  async save(
    input: SaveStoreAssetFileInput,
  ): Promise<StoredStoreAssetFile> {
    const storageKey = path.posix.join(
      "stores",
      input.storeId,
      input.category,
      `${randomUUID()}.${input.extension}`,
    );
    const destination = this.resolveStorageKey(storageKey);

    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, input.content, { flag: "wx" });

    return {
      storageProvider: "local",
      storageKey,
      publicUrl: `${this.publicBaseUrl}/${storageKey
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: input.content.byteLength,
      width: input.width,
      height: input.height,
    };
  }

  async remove(storageKey: string): Promise<void> {
    const destination = this.resolveStorageKey(storageKey);
    await rm(destination, { force: true });
  }

  private resolveStorageKey(storageKey: string): string {
    if (
      !/^[A-Za-z0-9][A-Za-z0-9/_.-]{0,999}$/.test(storageKey) ||
      storageKey.includes("..") ||
      storageKey.includes("//") ||
      path.posix.isAbsolute(storageKey)
    ) {
      throw new Error("Invalid store asset storage key.");
    }

    const resolved = path.resolve(this.root, ...storageKey.split("/"));
    const rootWithSeparator = `${this.root}${path.sep}`;

    if (resolved !== this.root && !resolved.startsWith(rootWithSeparator)) {
      throw new Error("Store asset path escaped the configured storage root.");
    }

    return resolved;
  }
}
