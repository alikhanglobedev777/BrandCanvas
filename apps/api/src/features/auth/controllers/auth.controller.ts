import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AppEnvironment } from "../../../config/env.schema";
import { ACCESS_COOKIE_NAME, CSRF_COOKIE_NAME, REFRESH_COOKIE_NAME } from "../../../common/auth/auth.constants";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { AuthResponseDto, AuthUserDto, ChangePasswordDto, LoginDto, MessageResponseDto } from "../dto";
import { AuthService, type AuthSessionResult } from "../services";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  private readonly secureCookies: boolean;
  private readonly accessTtlSeconds: number;

  constructor(
    private readonly authService: AuthService,
    config: ConfigService<AppEnvironment, true>,
  ) {
    this.secureCookies = config.get("NODE_ENV", { infer: true }) === "production";
    this.accessTtlSeconds = config.get("ACCESS_TOKEN_TTL_SECONDS", { infer: true });
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sign in a super admin or seller" })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) reply: FastifyReply): Promise<AuthResponseDto> {
    const result = await this.authService.login(body);
    this.setSessionCookies(reply, result);
    return result.response;
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate the refresh token and issue a new access token" })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply): Promise<AuthResponseDto> {
    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];
    if (!refreshToken) throw new UnauthorizedException("Refresh token is required.");
    const result = await this.authService.refresh(refreshToken);
    this.setSessionCookies(reply, result);
    return result.response;
  }

  @Get("me")
  @ApiCookieAuth("brandcanvas_access")
  @ApiOperation({ summary: "Get the authenticated account" })
  @ApiOkResponse({ type: AuthUserDto })
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserDto> {
    return this.authService.me(user.userId);
  }

  @UseGuards(CsrfGuard)
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth("brandcanvas_access")
  @ApiOperation({ summary: "Change the authenticated account password" })
  @ApiOkResponse({ type: MessageResponseDto })
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() body: ChangePasswordDto): Promise<MessageResponseDto> {
    await this.authService.changePassword(user.userId, body);
    return { message: "Password changed successfully." };
  }

  @UseGuards(CsrfGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth("brandcanvas_access")
  @ApiOperation({ summary: "Revoke the current session" })
  @ApiOkResponse({ type: MessageResponseDto })
  async logout(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) reply: FastifyReply): Promise<MessageResponseDto> {
    await this.authService.logout(user.sessionId);
    this.clearSessionCookies(reply);
    return { message: "Signed out successfully." };
  }

  private setSessionCookies(reply: FastifyReply, result: AuthSessionResult): void {
    const base = { secure: this.secureCookies, sameSite: "lax" as const, path: "/" };
    reply.setCookie(ACCESS_COOKIE_NAME, result.accessToken, { ...base, httpOnly: true, maxAge: this.accessTtlSeconds });
    reply.setCookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      ...base,
      httpOnly: true,
      expires: result.refreshExpiresAt,
    });
    reply.setCookie(CSRF_COOKIE_NAME, result.csrfToken, { ...base, httpOnly: false, expires: result.refreshExpiresAt });
  }

  private clearSessionCookies(reply: FastifyReply): void {
    const options = { secure: this.secureCookies, sameSite: "lax" as const, path: "/" };
    reply.clearCookie(ACCESS_COOKIE_NAME, options);
    reply.clearCookie(REFRESH_COOKIE_NAME, options);
    reply.clearCookie(CSRF_COOKIE_NAME, options);
  }
}
