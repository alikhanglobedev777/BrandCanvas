import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt, { type JwtHeader } from "jsonwebtoken";
import type { AppEnvironment } from "../../../config/env.schema";
import { AUTH_AUDIENCE, AUTH_ISSUER } from "../../../common/auth/auth.constants";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";

interface AccessTokenClaims {
  sub: string;
  sessionId: string;
  platformRole: "super_admin" | "user";
  storeId?: string;
}

@Injectable()
export class TokenService {
  private readonly activeKid: string;
  private readonly keyRing: Record<string, string>;
  private readonly ttlSeconds: number;

  constructor(config: ConfigService<AppEnvironment, true>) {
    this.activeKid = config.get("JWT_ACTIVE_KID", { infer: true });
    this.keyRing = config.get("JWT_KEY_RING_JSON", { infer: true });
    this.ttlSeconds = config.get("ACCESS_TOKEN_TTL_SECONDS", { infer: true });
  }

  signAccessToken(user: AuthenticatedUser): string {
    const secret = this.keyRing[this.activeKid];
    if (!secret) throw new Error(`JWT key ${this.activeKid} is not configured.`);

    const payload: AccessTokenClaims = {
      sub: user.userId,
      sessionId: user.sessionId,
      platformRole: user.platformRole,
      ...(user.storeId ? { storeId: user.storeId } : {}),
    };

    return jwt.sign(payload, secret, {
      algorithm: "HS256",
      keyid: this.activeKid,
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE,
      expiresIn: this.ttlSeconds,
    });
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    try {
      const decoded = jwt.decode(token, { complete: true });
      const header = decoded?.header as JwtHeader | undefined;
      const kid = header?.kid;
      if (!kid || !this.keyRing[kid]) {
        throw new UnauthorizedException("Unknown access-token signing key.");
      }

      const payload = jwt.verify(token, this.keyRing[kid], {
        algorithms: ["HS256"],
        issuer: AUTH_ISSUER,
        audience: AUTH_AUDIENCE,
      }) as unknown as AccessTokenClaims;

      return {
        userId: payload.sub,
        sessionId: payload.sessionId,
        platformRole: payload.platformRole,
        ...(payload.storeId ? { storeId: payload.storeId } : {}),
      };
    } catch {
      throw new UnauthorizedException("The access token is invalid or expired.");
    }
  }
}
