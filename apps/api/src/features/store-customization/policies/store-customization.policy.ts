import { ForbiddenException, Injectable } from "@nestjs/common";
import { StoreCustomizationRepository } from "../repositories";

@Injectable()
export class StoreCustomizationPolicy {
  constructor(private readonly repository: StoreCustomizationRepository) {}

  async assertSellerCanCustomize(
    userId: string,
    storeId: string | undefined,
  ): Promise<string> {
    if (!storeId) {
      throw new ForbiddenException({
        code: "STORE_ACCESS_DENIED",
        message: "No store is assigned to this account.",
      });
    }
    const access = await this.repository.findSellerAccess(userId, storeId);
    if (!access) {
      throw new ForbiddenException({
        code: "STORE_ACCESS_DENIED",
        message: "Store membership is required.",
      });
    }
    if (access.status !== "active") {
      throw new ForbiddenException({
        code: "STORE_INACTIVE",
        message: "Only active stores can be customized.",
      });
    }
    if (access.memberRole !== "owner" && access.memberRole !== "admin") {
      throw new ForbiddenException({
        code: "STORE_CUSTOMIZATION_FORBIDDEN",
        message:
          "Only store owners and administrators can customize the store.",
      });
    }
    return storeId;
  }
}
