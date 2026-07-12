import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDatabase, type BrandCanvasDatabase } from "@brandcanvas/database";
import type { AppEnvironment } from "../../config/env.schema";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  readonly db: BrandCanvasDatabase;
  private readonly closeConnection: () => Promise<void>;

  constructor(config: ConfigService<AppEnvironment, true>) {
    const connection = createDatabase(config.get("DATABASE_URL", { infer: true }));
    this.db = connection.db;
    this.closeConnection = connection.close;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.closeConnection();
  }
}
