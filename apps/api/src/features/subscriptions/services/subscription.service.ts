import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { AssignPlanDto, CreatePlanDto } from "../dto";
import { SubscriptionRepository } from "../repositories/subscription.repository";

@Injectable()
export class SubscriptionService {
  constructor(private readonly repository: SubscriptionRepository) {}

  async listPlans() {
    return { items: await this.repository.plans() };
  }

  async createPlan(input: CreatePlanDto) {
    const result = await this.repository.createPlan(input);
    if (result === "duplicate") {
      throw new ConflictException({ code: "PLAN_CODE_CONFLICT", message: "A plan with this code already exists." });
    }
    return result;
  }

  async assignPlan(input: AssignPlanDto, actorUserId: string) {
    const result = await this.repository.assign(input, actorUserId);
    if (result === "not_found") {
      throw new NotFoundException({ code: "PLAN_OR_STORE_NOT_FOUND", message: "The selected plan or store was not found." });
    }
    return result;
  }

  async current(storeId: string) {
    const subscription = await this.repository.current(storeId);
    if (!subscription) {
      throw new NotFoundException({ code: "SUBSCRIPTION_NOT_FOUND", message: "No active subscription is assigned to this store." });
    }
    return subscription;
  }

  async usage(storeId: string) {
    const usage = await this.repository.usage(storeId);
    if (!usage) {
      throw new NotFoundException({ code: "SUBSCRIPTION_NOT_FOUND", message: "No active subscription is assigned to this store." });
    }
    return usage;
  }

  async assertProductLimit(storeId: string): Promise<void> {
    if (!(await this.repository.assertProduct(storeId))) {
      throw new ConflictException({ code: "PLAN_PRODUCT_LIMIT_REACHED", message: "The store has reached its product limit." });
    }
  }

  sellerAnalytics(storeId: string) {
    return this.repository.sellerAnalytics(storeId);
  }

  platformAnalytics() {
    return this.repository.platformAnalytics();
  }
}
