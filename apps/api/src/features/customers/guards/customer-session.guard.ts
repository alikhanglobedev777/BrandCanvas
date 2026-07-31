import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { customerSessions, customers } from "@brandcanvas/database";
import { and, eq, gt, isNull } from "drizzle-orm";
import { createHash } from "node:crypto";
import { DatabaseService } from "../../../infrastructure/database";
import type { FastifyRequest } from "fastify";
const COOKIE = "brandcanvas_customer_session";
@Injectable()
export class CustomerSessionGuard implements CanActivate {
  constructor(private readonly database: DatabaseService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest & { customer?: unknown }>();
    const raw = request.cookies[COOKIE];
    if (!raw) throw new UnauthorizedException({ code: "CUSTOMER_AUTH_REQUIRED", message: "Customer authentication is required." });
    const hash = createHash("sha256").update(raw).digest("hex");
    const [row] = await this.database.db.select({ sessionId: customerSessions.id, customerId: customers.id, storeId: customers.storeId, email: customers.email, status: customers.status }).from(customerSessions).innerJoin(customers, eq(customers.id, customerSessions.customerId)).where(and(eq(customerSessions.tokenHash, hash), gt(customerSessions.expiresAt, new Date()), isNull(customerSessions.revokedAt))).limit(1);
    if (!row || row.status !== "active") throw new UnauthorizedException({ code: "CUSTOMER_SESSION_INVALID", message: "Customer session is invalid or expired." });
    request.customer = row;
    return true;
  }
}
export const CUSTOMER_SESSION_COOKIE = COOKIE;
