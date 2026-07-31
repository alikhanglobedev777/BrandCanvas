import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { storeMembers, stores } from "@brandcanvas/database";
import { and, eq } from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import type { AuthenticatedRequest } from "../../../common/types/authenticated-request";
@Injectable()
export class OrderPermissionGuard implements CanActivate {
  constructor(private readonly database: DatabaseService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const storeId = request.user.storeId;
    if (!storeId) throw new ForbiddenException({ code: "STORE_ACCESS_DENIED", message: "No store is assigned to this account." });
    const [member] = await this.database.db.select({ role: storeMembers.role, status: stores.status }).from(storeMembers).innerJoin(stores, eq(stores.id, storeMembers.storeId)).where(and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, request.user.userId))).limit(1);
    if (!member || member.status !== "active" || !["owner", "admin", "order_manager"].includes(member.role)) throw new ForbiddenException({ code: "ORDER_PERMISSION_DENIED", message: "Your store role does not permit order management." });
    return true;
  }
}
