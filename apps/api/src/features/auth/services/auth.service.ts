import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppEnvironment } from "../../../config/env.schema";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { AuthResponseDto, AuthUserDto, ChangePasswordDto, LoginDto } from "../dto";
import { AuthRepository, type AuthUserRecord } from "../repositories";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

export interface AuthSessionResult {
  response: AuthResponseDto;
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly refreshTtlDays: number;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.refreshTtlDays = config.get("REFRESH_TOKEN_TTL_DAYS", { infer: true });
  }

  async login(input: LoginDto): Promise<AuthSessionResult> {
    const user = await this.authRepository.findUserForLogin(input.email.toLowerCase());
    if (!user || !(await this.passwordService.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException("Email or password is incorrect.");
    }
    this.assertUserCanLogin(user);

    const refreshSecret = randomBytes(48).toString("base64url");
    const refreshExpiresAt = this.getRefreshExpiry();
    const session = await this.authRepository.createSession({
      userId: user.id,
      ...(user.storeId ? { storeId: user.storeId } : {}),
      refreshTokenHash: this.hashRefreshSecret(refreshSecret),
      expiresAt: refreshExpiresAt,
    });

    return this.createSessionResult(user, session.id, refreshSecret, refreshExpiresAt);
  }

  async refresh(refreshToken: string): Promise<AuthSessionResult> {
    const [sessionId, refreshSecret] = refreshToken.split(".");
    if (!sessionId || !refreshSecret) {
      throw new UnauthorizedException("Refresh token is invalid.");
    }

    const session = await this.authRepository.findSession(sessionId);
    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Refresh session is invalid or expired.");
    }

    const expectedHash = Buffer.from(session.refreshTokenHash, "hex");
    const suppliedHash = Buffer.from(this.hashRefreshSecret(refreshSecret), "hex");
    if (expectedHash.length !== suppliedHash.length || !timingSafeEqual(expectedHash, suppliedHash)) {
      await this.authRepository.revokeSession(sessionId);
      throw new UnauthorizedException("Refresh-token reuse was detected. The session has been revoked.");
    }

    const user = await this.authRepository.findUserById(session.userId);
    if (!user) {
      await this.authRepository.revokeSession(sessionId);
      throw new UnauthorizedException("The account no longer exists.");
    }
    this.assertUserCanLogin(user);

    const nextSecret = randomBytes(48).toString("base64url");
    const nextExpiry = this.getRefreshExpiry();
    await this.authRepository.rotateSession(sessionId, this.hashRefreshSecret(nextSecret), nextExpiry);

    return this.createSessionResult(user, sessionId, nextSecret, nextExpiry);
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedException("The authenticated account no longer exists.");
    this.assertUserCanLogin(user);
    return this.toAuthUserDto(user);
  }

  async logout(sessionId: string): Promise<void> {
    await this.authRepository.revokeSession(sessionId);
  }

  async changePassword(userId: string, input: ChangePasswordDto): Promise<void> {
    const user = await this.authRepository.findUserById(userId);
    if (!user || !(await this.passwordService.verify(user.passwordHash, input.currentPassword))) {
      throw new UnauthorizedException("Current password is incorrect.");
    }
    if (input.currentPassword === input.newPassword) {
      throw new ForbiddenException("The new password must be different from the current password.");
    }
    await this.authRepository.updatePassword(userId, await this.passwordService.hash(input.newPassword));
  }

  private createSessionResult(user: AuthUserRecord, sessionId: string, refreshSecret: string, refreshExpiresAt: Date): AuthSessionResult {
    const authenticatedUser: AuthenticatedUser = {
      userId: user.id,
      sessionId,
      platformRole: user.platformRole,
      ...(user.storeId ? { storeId: user.storeId } : {}),
    };

    return {
      response: { user: this.toAuthUserDto(user) },
      accessToken: this.tokenService.signAccessToken(authenticatedUser),
      refreshToken: `${sessionId}.${refreshSecret}`,
      csrfToken: randomBytes(32).toString("base64url"),
      refreshExpiresAt,
    };
  }

  private toAuthUserDto(user: AuthUserRecord): AuthUserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      platformRole: user.platformRole,
      ...(user.storeId ? { storeId: user.storeId } : {}),
      ...(user.storeStatus ? { storeStatus: user.storeStatus } : {}),
      mustChangePassword: user.mustChangePassword,
    };
  }

  private assertUserCanLogin(user: AuthUserRecord): void {
    if (user.status !== "active") {
      throw new ForbiddenException("This account has been blocked.");
    }
    if (user.platformRole !== "super_admin" && user.storeStatus !== "active") {
      throw new ForbiddenException("Your store is not active. Contact BrandCanvas support.");
    }
  }

  private hashRefreshSecret(secret: string): string {
    return createHash("sha256").update(secret).digest("hex");
  }

  private getRefreshExpiry(): Date {
    return new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);
  }
}
