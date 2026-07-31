import { ConflictException,Injectable,NotFoundException } from "@nestjs/common";
import { CartService } from "../../cart/services/cart.service";
import { StorefrontService } from "../../storefront/services";
import type { CheckoutQueryDto,SaveCheckoutAddressDto,StartCheckoutDto } from "../dto";
import { CheckoutRepository } from "../repositories";
@Injectable() export class CheckoutService{
 constructor(private readonly repo:CheckoutRepository,private readonly storefront:StorefrontService,private readonly cart:CartService){}
 async start(host:string|undefined,input:StartCheckoutDto,token:string){const store=await this.storefront.resolve(host,input);const r=await this.repo.start({storeId:store.storeId,storeSlug:store.slug,guestTokenHash:this.cart.hash(token),idempotencyKey:input.idempotencyKey,expiresAt:new Date(Date.now()+30*60_000)});if(r==="cart_empty")throw new ConflictException({code:"CART_EMPTY",message:"Cart is empty."});if(r==="insufficient_stock")throw new ConflictException({code:"INSUFFICIENT_STOCK",message:"One or more items are unavailable."});return r;}
 async get(host:string|undefined,id:string,q:CheckoutQueryDto,token:string){const store=await this.storefront.resolve(host,q);const r=await this.repo.get({storeId:store.storeId,storeSlug:store.slug,guestTokenHash:this.cart.hash(token),checkoutId:id});if(!r)throw new NotFoundException({code:"CHECKOUT_NOT_FOUND",message:"Checkout not found."});return r;}
 async address(host:string|undefined,id:string,input:SaveCheckoutAddressDto,token:string){const store=await this.storefront.resolve(host,input);const r=await this.repo.saveAddress({storeId:store.storeId,storeSlug:store.slug,guestTokenHash:this.cart.hash(token),checkoutId:id,address:input});if(!r)throw new NotFoundException({code:"CHECKOUT_NOT_FOUND",message:"Checkout not found."});return r;}
 async cancel(host:string|undefined,id:string,q:CheckoutQueryDto,token:string){const store=await this.storefront.resolve(host,q);const r=await this.repo.cancel({storeId:store.storeId,storeSlug:store.slug,guestTokenHash:this.cart.hash(token),checkoutId:id});if(!r)throw new NotFoundException({code:"CHECKOUT_NOT_FOUND",message:"Checkout not found."});return r;}
}
