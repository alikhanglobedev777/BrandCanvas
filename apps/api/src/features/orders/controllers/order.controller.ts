import { Body, Controller, Get, Headers, Post, Query, Req } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { Public } from "../../../common/decorators/public.decorator";
import { OrderResponseDto, PlaceOrderDto, TrackOrderQueryDto } from "../dto";
import { OrderService } from "../services/order.service";
@ApiTags("Public Orders") @Public() @Controller("public/orders")
export class OrderController {
  constructor(private readonly service: OrderService) {}
  private token(request: FastifyRequest) { const token = request.cookies.brandcanvas_cart; if (!token) throw new Error("Cart cookie is required."); return token; }
  @Post() @ApiCreatedResponse({ type: OrderResponseDto }) place(@Headers("host") host: string | undefined, @Body() input: PlaceOrderDto, @Req() request: FastifyRequest) { return this.service.place(host, input, this.token(request)); }
  @Get("track") @ApiOkResponse({ type: OrderResponseDto }) track(@Query() query: TrackOrderQueryDto) { return this.service.track(query); }
}
