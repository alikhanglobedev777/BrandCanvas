import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { CSRF_COOKIE_NAME } from "../auth/auth.constants";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const cookieToken = request.cookies[CSRF_COOKIE_NAME];
    const headerToken = request.headers["x-csrf-token"];
    if (!cookieToken || typeof headerToken !== "string" || cookieToken !== headerToken) {
      throw new ForbiddenException("CSRF token validation failed.");
    }
    return true;
  }
}
