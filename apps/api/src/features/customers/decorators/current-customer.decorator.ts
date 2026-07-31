import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedCustomer } from "../types/customer-session";
export const CurrentCustomer = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedCustomer => context.switchToHttp().getRequest<{ customer: AuthenticatedCustomer }>().customer);
