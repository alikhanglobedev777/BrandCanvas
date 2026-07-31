import { Module } from "@nestjs/common";
import { StorefrontModule } from "../storefront";
import { CartController } from "./controllers/cart.controller";
import { CartRepository, DrizzleCartRepository } from "./repositories";
import { CartService } from "./services/cart.service";
@Module({imports:[StorefrontModule],controllers:[CartController],providers:[CartService,DrizzleCartRepository,{provide:CartRepository,useExisting:DrizzleCartRepository}],exports:[CartService,CartRepository]})
export class CartModule{}
