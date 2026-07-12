import type { StoreEntity } from "../entities";
import type { StoreStatusCountDto, StoreStatusValue } from "../dto";

export interface StoreListInput {
  page: number;
  pageSize: number;
  search?: string;
  status?: StoreStatusValue;
}

export interface StoreListResult {
  items: StoreEntity[];
  total: number;
}

export interface CreateStorePersistenceInput {
  sellerName: string;
  sellerEmail: string;
  passwordHash: string;
  storeName: string;
  slug: string;
  subdomain: string;
  status: StoreStatusValue;
}

export abstract class StoreRepository {
  abstract getSummary(): Promise<StoreStatusCountDto>;
  abstract findMany(input: StoreListInput): Promise<StoreListResult>;
  abstract findById(storeId: string): Promise<StoreEntity | null>;
  abstract createWithOwner(input: CreateStorePersistenceInput): Promise<StoreEntity>;
  abstract updateStatus(input: { storeId: string; status: StoreStatusValue; reason?: string; changedBy: string }): Promise<StoreEntity | null>;
}
