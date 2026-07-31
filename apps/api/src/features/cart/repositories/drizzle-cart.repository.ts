import { Injectable } from "@nestjs/common";
import { cartItems, carts, inventoryItems, productImages, products, productVariants } from "@brandcanvas/database";
import { and, asc, eq, sql } from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import type { CartItemDto, CartResponseDto } from "../dto";
import { CartRepository } from "./cart.repository";
@Injectable()
export class DrizzleCartRepository implements CartRepository {
 constructor(private readonly database: DatabaseService) {}
 async getOrCreate(input: { storeId:string;storeSlug:string;currency:string;guestTokenHash:string;expiresAt:Date }): Promise<CartResponseDto> {
  const [existing]=await this.database.db.select({id:carts.id}).from(carts).where(and(eq(carts.storeId,input.storeId),eq(carts.guestTokenHash,input.guestTokenHash),eq(carts.status,"active"))).limit(1);
  let cartId=existing?.id;
  if(!cartId){const [created]=await this.database.db.insert(carts).values({storeId:input.storeId,guestTokenHash:input.guestTokenHash,currency:input.currency,expiresAt:input.expiresAt}).returning({id:carts.id}); if(!created)throw new Error("Unable to create cart.");cartId=created.id;}
  return this.read(input.storeId,input.storeSlug,cartId);
 }
 async addItem(input:{storeId:string;storeSlug:string;currency:string;guestTokenHash:string;expiresAt:Date;productId:string;variantId:string;quantity:number}){
  return this.database.db.transaction(async(tx)=>{
   const [variant]=await tx.select({productId:products.id,variantId:productVariants.id,price:sql<number>`coalesce(${productVariants.priceOverrideMinor}, ${products.priceMinor})`,available:sql<number>`${inventoryItems.stockQuantity}-${inventoryItems.reservedQuantity}`}).from(productVariants).innerJoin(products,and(eq(products.id,productVariants.productId),eq(products.storeId,input.storeId))).innerJoin(inventoryItems,eq(inventoryItems.variantId,productVariants.id)).where(and(eq(productVariants.storeId,input.storeId),eq(productVariants.id,input.variantId),eq(productVariants.productId,input.productId),eq(products.status,"active"),eq(productVariants.isActive,true),sql`${products.archivedAt} is null`,sql`${productVariants.archivedAt} is null`)).limit(1);
   if(!variant)return "product_not_found" as const;
   const [existingCart]=await tx.select({id:carts.id}).from(carts).where(and(eq(carts.storeId,input.storeId),eq(carts.guestTokenHash,input.guestTokenHash),eq(carts.status,"active"))).limit(1);
   const cartId=existingCart?.id??(await tx.insert(carts).values({storeId:input.storeId,guestTokenHash:input.guestTokenHash,currency:input.currency,expiresAt:input.expiresAt}).returning({id:carts.id}))[0]!.id;
   const [existingItem]=await tx.select({id:cartItems.id,quantity:cartItems.quantity}).from(cartItems).where(and(eq(cartItems.cartId,cartId),eq(cartItems.variantId,input.variantId))).limit(1);
   const next=(existingItem?.quantity??0)+input.quantity; if(next>variant.available)return "insufficient_stock" as const;
   if(existingItem)await tx.update(cartItems).set({quantity:next,unitPriceMinor:variant.price,updatedAt:new Date()}).where(eq(cartItems.id,existingItem.id)); else await tx.insert(cartItems).values({storeId:input.storeId,cartId,productId:input.productId,variantId:input.variantId,quantity:input.quantity,unitPriceMinor:variant.price});
   return this.read(input.storeId,input.storeSlug,cartId,tx);
  });
 }
 async updateItem(input:{storeId:string;storeSlug:string;guestTokenHash:string;itemId:string;quantity:number}){
  return this.database.db.transaction(async(tx)=>{const [row]=await tx.select({cartId:carts.id,available:sql<number>`${inventoryItems.stockQuantity}-${inventoryItems.reservedQuantity}`}).from(cartItems).innerJoin(carts,and(eq(carts.id,cartItems.cartId),eq(carts.storeId,input.storeId),eq(carts.guestTokenHash,input.guestTokenHash),eq(carts.status,"active"))).innerJoin(inventoryItems,eq(inventoryItems.variantId,cartItems.variantId)).where(eq(cartItems.id,input.itemId)).limit(1);if(!row)return "not_found" as const;if(input.quantity>row.available)return "insufficient_stock" as const;await tx.update(cartItems).set({quantity:input.quantity,updatedAt:new Date()}).where(eq(cartItems.id,input.itemId));return this.read(input.storeId,input.storeSlug,row.cartId,tx);});
 }
 async removeItem(input:{storeId:string;storeSlug:string;guestTokenHash:string;itemId:string}){return this.database.db.transaction(async(tx)=>{const [row]=await tx.select({cartId:carts.id}).from(cartItems).innerJoin(carts,and(eq(carts.id,cartItems.cartId),eq(carts.storeId,input.storeId),eq(carts.guestTokenHash,input.guestTokenHash),eq(carts.status,"active"))).where(eq(cartItems.id,input.itemId)).limit(1);if(!row)return "not_found" as const;await tx.delete(cartItems).where(eq(cartItems.id,input.itemId));return this.read(input.storeId,input.storeSlug,row.cartId,tx);});}
 async clear(input:{storeId:string;storeSlug:string;guestTokenHash:string}){const cart=await this.getOrCreate({storeId:input.storeId,storeSlug:input.storeSlug,currency:"PKR",guestTokenHash:input.guestTokenHash,expiresAt:new Date(Date.now()+30*86400000)});await this.database.db.delete(cartItems).where(eq(cartItems.cartId,cart.id));return this.read(input.storeId,input.storeSlug,cart.id);}
 private async read(storeId:string,storeSlug:string,cartId:string,db:any=this.database.db):Promise<CartResponseDto>{
  const [cart]=await db.select({id:carts.id,currency:carts.currency,expiresAt:carts.expiresAt}).from(carts).where(and(eq(carts.id,cartId),eq(carts.storeId,storeId))).limit(1);if(!cart)throw new Error("Cart not found.");
  const rows=await db.select({id:cartItems.id,productId:cartItems.productId,variantId:cartItems.variantId,productName:products.name,productSlug:products.slug,variantTitle:productVariants.title,quantity:cartItems.quantity,storedPrice:cartItems.unitPriceMinor,currentPrice:sql<number>`coalesce(${productVariants.priceOverrideMinor},${products.priceMinor})`,stock:inventoryItems.stockQuantity,reserved:inventoryItems.reservedQuantity,imageUrl:productImages.publicUrl}).from(cartItems).innerJoin(products,eq(products.id,cartItems.productId)).innerJoin(productVariants,eq(productVariants.id,cartItems.variantId)).innerJoin(inventoryItems,eq(inventoryItems.variantId,cartItems.variantId)).leftJoin(productImages,and(eq(productImages.productId,products.id),eq(productImages.isPrimary,true))).where(eq(cartItems.cartId,cartId)).orderBy(asc(cartItems.createdAt));
  const items:CartItemDto[]=rows.map((r:any)=>({id:r.id,productId:r.productId,variantId:r.variantId,productName:r.productName,productSlug:r.productSlug,variantTitle:r.variantTitle,imageUrl:r.imageUrl??null,quantity:r.quantity,unitPriceMinor:r.currentPrice,lineTotalMinor:r.currentPrice*r.quantity,availableForSale:r.stock-r.reserved>=r.quantity,warning:r.storedPrice!==r.currentPrice?"Price changed since this item was added.":r.stock-r.reserved<r.quantity?"Requested quantity is no longer available.":null}));
  return {id:cart.id,storeSlug,currency:cart.currency,items,itemCount:items.reduce((n,i)=>n+i.quantity,0),subtotalMinor:items.reduce((n,i)=>n+i.lineTotalMinor,0),expiresAt:cart.expiresAt.toISOString()};
 }
}
