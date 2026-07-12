import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { AuthenticatedRequest } from "../../../common/types/authenticated-request";
import { StoreCustomizationPolicy } from "../policies";

@Injectable()
export class StoreCustomizationAccessGuard implements CanActivate {
  constructor(private readonly policy: StoreCustomizationPolicy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    await this.policy.assertSellerCanCustomize(
      request.user.userId,
      request.user.storeId,
    );
    return true;
  }
}
