import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import type { AddCartItemDto, CartTenantQueryDto, UpdateCartItemDto } from "../dto";
import { CartRepository } from "../repositories";
import { StorefrontService } from "../../storefront/services";
@Injectable()
export class CartService {
 constructor(private readonly repository:CartRepository,private readonly storefront:StorefrontService){}
 createToken(){return randomBytes(32).toString("base64url");}
 hash(token:string){return createHash("sha256").update(token).digest("hex");}
 async get(host:string|undefined,query:CartTenantQueryDto,token:string){const store=await this.storefront.resolve(host,query);return this.repository.getOrCreate({storeId:store.storeId,storeSlug:store.slug,currency:store.currency,guestTokenHash:this.hash(token),expiresAt:this.expiry()});}
 async add(host:string|undefined,input:AddCartItemDto,token:string){const store=await this.storefront.resolve(host,input);const result=await this.repository.addItem({storeId:store.storeId,storeSlug:store.slug,currency:store.currency,guestTokenHash:this.hash(token),expiresAt:this.expiry(),productId:input.productId,variantId:input.variantId,quantity:input.quantity});this.throwResult(result);return result;}
 async update(host:string|undefined,itemId:string,input:UpdateCartItemDto,token:string){const store=await this.storefront.resolve(host,input);const result=await this.repository.updateItem({storeId:store.storeId,storeSlug:store.slug,guestTokenHash:this.hash(token),itemId,quantity:input.quantity});this.throwResult(result);return result;}
 async remove(host:string|undefined,itemId:string,query:CartTenantQueryDto,token:string){const store=await this.storefront.resolve(host,query);const result=await this.repository.removeItem({storeId:store.storeId,storeSlug:store.slug,guestTokenHash:this.hash(token),itemId});this.throwResult(result);return result;}
 async clear(host:string|undefined,query:CartTenantQueryDto,token:string){const store=await this.storefront.resolve(host,query);return this.repository.clear({storeId:store.storeId,storeSlug:store.slug,guestTokenHash:this.hash(token)});}
 private expiry(){return new Date(Date.now()+30*86400000)}
 private throwResult(result:unknown){if(result==="product_not_found"||result==="not_found")throw new NotFoundException({code:"CART_ITEM_NOT_FOUND",message:"Cart item or product not found."});if(result==="insufficient_stock")throw new ConflictException({code:"INSUFFICIENT_STOCK",message:"Requested quantity is unavailable."});}
}
