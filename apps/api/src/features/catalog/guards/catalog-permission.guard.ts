import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { storeMembers, stores } from "@brandcanvas/database";
import { and, eq } from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import type { AuthenticatedRequest } from "../../../common/types/authenticated-request";
import {
  hasCatalogPermission,
  type CatalogPermission,
} from "./catalog-permission.policy";

const CATALOG_PERMISSION = "brandcanvas:catalog-permission";
export const RequireCatalogPermission = (permission: CatalogPermission) =>
  SetMetadata(CATALOG_PERMISSION, permission);

@Injectable()
export class CatalogPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly database: DatabaseService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const storeId = request.user.storeId;
    if (!storeId)
      throw new ForbiddenException({
        code: "STORE_ACCESS_DENIED",
        message: "No store is assigned to this account.",
      });
    const [member] = await this.database.db
      .select({ role: storeMembers.role, status: stores.status })
      .from(storeMembers)
      .innerJoin(stores, eq(stores.id, storeMembers.storeId))
      .where(
        and(
          eq(storeMembers.storeId, storeId),
          eq(storeMembers.userId, request.user.userId),
        ),
      )
      .limit(1);
    const permission =
      this.reflector.getAllAndOverride<CatalogPermission>(CATALOG_PERMISSION, [
        context.getHandler(),
        context.getClass(),
      ]) ?? "catalog";
    if (
      !member ||
      !hasCatalogPermission(member.role, member.status, permission)
    )
      throw new ForbiddenException({
        code: "CATALOG_PERMISSION_DENIED",
        message: "Your store role does not permit this catalog operation.",
      });
    return true;
  }
}
