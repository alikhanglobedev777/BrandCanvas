import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { Public } from "../../../common/decorators/public.decorator";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import { OrderResponseDto } from "../../orders/dto";
import { OrderRepository } from "../../orders/repositories";
import { CurrentCustomer } from "../decorators/current-customer.decorator";
import { CustomerAddressDto, CustomerAddressInputDto, CustomerAddressListDto, CustomerAuthResponseDto, CustomerMessageDto, CustomerProfileDto, UpdateCustomerProfileDto } from "../dto";
import { CUSTOMER_SESSION_COOKIE, CustomerSessionGuard } from "../guards/customer-session.guard";
import { CustomerService } from "../services/customer.service";
import type { AuthenticatedCustomer } from "../types/customer-session";
@ApiTags("Customer Account") @Public() @UseGuards(CustomerSessionGuard) @Controller("customer/account")
export class CustomerAccountController {
  constructor(private readonly service: CustomerService, private readonly orders: OrderRepository) {}
  @Get("me") @ApiOkResponse({ type: CustomerProfileDto }) me(@CurrentCustomer() customer: AuthenticatedCustomer) { return this.service.profile(customer.storeId, customer.customerId); }
  @Patch("profile") @UseGuards(CsrfGuard) @ApiOkResponse({ type: CustomerProfileDto }) update(@CurrentCustomer() customer: AuthenticatedCustomer, @Body() input: UpdateCustomerProfileDto) { return this.service.update(customer.storeId, customer.customerId, input); }
  @Post("refresh") @UseGuards(CsrfGuard) @ApiOkResponse({ type: CustomerAuthResponseDto }) async refresh(@CurrentCustomer() customer: AuthenticatedCustomer, @Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) { const result = await this.service.refresh(customer, { userAgent: request.headers["user-agent"], ipAddress: request.ip }); reply.setCookie(CUSTOMER_SESSION_COOKIE, result.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400 }); return { customer: result.customer }; }
  @Post("logout") @UseGuards(CsrfGuard) @ApiOkResponse({ type: CustomerMessageDto }) async logout(@CurrentCustomer() customer: AuthenticatedCustomer, @Res({ passthrough: true }) reply: FastifyReply) { await this.service.logout(customer.sessionId); reply.clearCookie(CUSTOMER_SESSION_COOKIE, { path: "/" }); return { message: "Signed out successfully." }; }
  @Get("addresses") @ApiOkResponse({ type: CustomerAddressListDto }) addresses(@CurrentCustomer() customer: AuthenticatedCustomer) { return this.service.addresses(customer.storeId, customer.customerId); }
  @Post("addresses") @UseGuards(CsrfGuard) @ApiOkResponse({ type: CustomerAddressDto }) createAddress(@CurrentCustomer() customer: AuthenticatedCustomer, @Body() input: CustomerAddressInputDto) { return this.service.createAddress(customer.storeId, customer.customerId, input); }
  @Patch("addresses/:addressId") @UseGuards(CsrfGuard) @ApiOkResponse({ type: CustomerAddressDto }) updateAddress(@CurrentCustomer() customer: AuthenticatedCustomer, @Param("addressId") addressId: string, @Body() input: CustomerAddressInputDto) { return this.service.updateAddress(customer.storeId, customer.customerId, addressId, input); }
  @Delete("addresses/:addressId") @UseGuards(CsrfGuard) @ApiOkResponse({ type: CustomerMessageDto }) deleteAddress(@CurrentCustomer() customer: AuthenticatedCustomer, @Param("addressId") addressId: string) { return this.service.deleteAddress(customer.storeId, customer.customerId, addressId); }
  @Get("orders") @ApiOkResponse({ type: [OrderResponseDto] }) ordersList(@CurrentCustomer() customer: AuthenticatedCustomer) { return this.orders.listCustomer(customer.storeId, customer.email); }
  @Get("orders/:orderId") @ApiOkResponse({ type: OrderResponseDto }) async order(@CurrentCustomer() customer: AuthenticatedCustomer, @Param("orderId") orderId: string) { const result = await this.orders.getCustomer(customer.storeId, customer.email, orderId); if (!result) throw new NotFoundException({ code: "ORDER_NOT_FOUND", message: "Order not found." }); return result; }
}
