import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthenticatedRequest } from "../types/authenticated-request";
import type { PlatformRole } from "../types/authenticated-user";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<PlatformRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!roles.includes(request.user.platformRole)) {
      throw new ForbiddenException("You do not have permission to access this resource.");
    }
    return true;
  }
}
