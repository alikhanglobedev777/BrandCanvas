import { Module } from "@nestjs/common";
import { AuthModule } from "../auth";
import { CartModule } from "../cart";
import { OrdersModule } from "../orders";
import { StorefrontModule } from "../storefront";
import { CustomerAccountController } from "./controllers/customer-account.controller";
import { CustomerAuthController } from "./controllers/customer-auth.controller";
import { CustomerSessionGuard } from "./guards/customer-session.guard";
import { CustomerRepository, DrizzleCustomerRepository } from "./repositories";
import { CustomerService } from "./services/customer.service";
@Module({ imports: [AuthModule, CartModule, StorefrontModule, OrdersModule], controllers: [CustomerAuthController, CustomerAccountController], providers: [CustomerService, CustomerSessionGuard, DrizzleCustomerRepository, { provide: CustomerRepository, useExisting: DrizzleCustomerRepository }], exports: [CustomerService, CustomerSessionGuard, CustomerRepository] })
export class CustomersModule {}
