import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";
import { ACCESS_COOKIE_NAME } from "../auth/auth.constants";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { AuthenticatedRequest } from "../types/authenticated-request";
import { TokenService } from "../../features/auth/services/token.service";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = request.cookies[ACCESS_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException("Authentication is required.");
    }

    const user = this.tokenService.verifyAccessToken(token);
    (request as AuthenticatedRequest).user = user;
    return true;
  }
}
