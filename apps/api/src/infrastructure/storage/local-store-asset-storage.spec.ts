import type { ConfigService } from "@nestjs/config";
import { access, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppEnvironment } from "../../config/env.schema";
import { LocalStoreAssetStorage } from "./local-store-asset-storage";

describe("LocalStoreAssetStorage", () => {
  let root: string;
  let storage: LocalStoreAssetStorage;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "brandcanvas-assets-"));
    const config = {
      get: vi.fn((key: keyof AppEnvironment) => {
        if (key === "STORE_ASSET_STORAGE_ROOT") return root;
        if (key === "STORE_ASSET_PUBLIC_BASE_URL") {
          return "http://localhost:4000/uploads";
        }
        return undefined;
      }),
    } as unknown as ConfigService<AppEnvironment, true>;
    storage = new LocalStoreAssetStorage(config);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("generates a server-controlled key and stores inside the configured root", async () => {
    const stored = await storage.save({
      storeId: "f4c8b82d-8bb1-4fe0-98e3-36f137b31bb1",
      category: "logo",
      extension: "webp",
      content: Buffer.from("safe-image"),
      mimeType: "image/webp",
      width: 100,
      height: 50,
      originalFilename: "logo.png",
    });

    expect(stored.storageKey).toMatch(
      /^stores\/f4c8b82d-8bb1-4fe0-98e3-36f137b31bb1\/logo\/[0-9a-f-]+\.webp$/,
    );
    await expect(
      access(path.resolve(root, ...stored.storageKey.split("/"))),
    ).resolves.toBeUndefined();
  });

  it("rejects traversal keys before touching the filesystem", async () => {
    await expect(storage.remove("../outside.txt")).rejects.toThrow(
      "Invalid store asset storage key",
    );
  });
});
