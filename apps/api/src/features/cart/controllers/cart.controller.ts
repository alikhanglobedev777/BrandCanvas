import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, Req, Res } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";
import { Public } from "../../../common/decorators/public.decorator";
import { AddCartItemDto, CartResponseDto, CartTenantQueryDto, UpdateCartItemDto } from "../dto";
import { CartService } from "../services/cart.service";
const COOKIE="brandcanvas_cart";
@ApiTags("Public Cart") @Public() @Controller("public/cart")
export class CartController{
 constructor(private readonly service:CartService){}
 private token(req:FastifyRequest,res:FastifyReply){let token=req.cookies[COOKIE];if(!token){token=this.service.createToken();res.setCookie(COOKIE,token,{httpOnly:true,sameSite:"lax",path:"/api/v1/public",maxAge:30*86400,secure:process.env.NODE_ENV==="production"});}return token;}
 @Get() @ApiOkResponse({type:CartResponseDto}) get(@Headers("host")host:string|undefined,@Query()query:CartTenantQueryDto,@Req()req:FastifyRequest,@Res({passthrough:true})res:FastifyReply){return this.service.get(host,query,this.token(req,res));}
 @Post("items") @ApiCreatedResponse({type:CartResponseDto}) addItem(@Headers("host")host:string|undefined,@Body()input:AddCartItemDto,@Req()req:FastifyRequest,@Res({passthrough:true})res:FastifyReply){return this.service.add(host,input,this.token(req,res));}
 @Patch("items/:itemId") @ApiOkResponse({type:CartResponseDto}) updateItem(@Headers("host")host:string|undefined,@Param("itemId")itemId:string,@Body()input:UpdateCartItemDto,@Req()req:FastifyRequest,@Res({passthrough:true})res:FastifyReply){return this.service.update(host,itemId,input,this.token(req,res));}
 @Delete("items/:itemId") @ApiOkResponse({type:CartResponseDto}) removeItem(@Headers("host")host:string|undefined,@Param("itemId")itemId:string,@Query()query:CartTenantQueryDto,@Req()req:FastifyRequest,@Res({passthrough:true})res:FastifyReply){return this.service.remove(host,itemId,query,this.token(req,res));}
 @Delete() @ApiOkResponse({type:CartResponseDto}) clear(@Headers("host")host:string|undefined,@Query()query:CartTenantQueryDto,@Req()req:FastifyRequest,@Res({passthrough:true})res:FastifyReply){return this.service.clear(host,query,this.token(req,res));}
}
