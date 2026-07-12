import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { stores } from "@brandcanvas/database";
import { eq } from "drizzle-orm";
import { DatabaseService } from "../../infrastructure/database";
import type { AuthenticatedRequest } from "../types/authenticated-request";

@Injectable()
export class ActiveStoreGuard implements CanActivate {
  constructor(private readonly database: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const storeId = request.user.storeId;

    if (!storeId) {
      throw new ForbiddenException("No store is assigned to this account.");
    }

    const [store] = await this.database.db
      .select({ status: stores.status })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store || store.status !== "active") {
      throw new ForbiddenException({
        code: "STORE_INACTIVE",
        message: "This store is not active. Contact BrandCanvas support.",
      });
    }

    return true;
  }
}
