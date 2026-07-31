import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { Public } from "../../../common/decorators/public.decorator";
import { CSRF_COOKIE_NAME } from "../../../common/auth/auth.constants";
import { CustomerAuthResponseDto, CustomerForgotPasswordDto, CustomerLoginDto, CustomerMessageDto, CustomerRegisterDto, CustomerResetPasswordDto } from "../dto";
import { CustomerService } from "../services/customer.service";
import { CUSTOMER_SESSION_COOKIE } from "../guards/customer-session.guard";
@ApiTags("Customer Authentication") @Public() @Controller("public/customers")
export class CustomerAuthController {
  constructor(private readonly service: CustomerService) {}
  private context(request: FastifyRequest) { return { guestCartToken: request.cookies.brandcanvas_cart, userAgent: request.headers["user-agent"], ipAddress: request.ip }; }
  private set(reply: FastifyReply, token: string) { const secure = process.env.NODE_ENV === "production"; reply.setCookie(CUSTOMER_SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 30 * 86400 }); reply.setCookie(CSRF_COOKIE_NAME, randomBytes(24).toString("base64url"), { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: 30 * 86400 }); }
  @Post("register") @ApiOkResponse({ type: CustomerAuthResponseDto }) async register(@Body() input: CustomerRegisterDto, @Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) { const result = await this.service.register(request.headers.host, input, this.context(request)); this.set(reply, result.token); return { customer: result.customer }; }
  @Post("login") @HttpCode(HttpStatus.OK) @ApiOkResponse({ type: CustomerAuthResponseDto }) async login(@Body() input: CustomerLoginDto, @Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) { const result = await this.service.login(request.headers.host, input, this.context(request)); this.set(reply, result.token); return { customer: result.customer }; }
  @Post("forgot-password") @HttpCode(HttpStatus.OK) @ApiOkResponse({ type: CustomerMessageDto }) forgot(@Body() input: CustomerForgotPasswordDto, @Req() request: FastifyRequest) { return this.service.forgot(request.headers.host, input); }
  @Post("reset-password") @HttpCode(HttpStatus.OK) @ApiOkResponse({ type: CustomerMessageDto }) reset(@Body() input: CustomerResetPasswordDto) { return this.service.reset(input); }
}
