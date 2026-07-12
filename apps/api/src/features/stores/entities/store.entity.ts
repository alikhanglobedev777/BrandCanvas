import type { StoreStatusValue } from "../dto";

export interface StoreOwnerEntity {
  id: string;
  name: string;
  email: string;
}

export interface StoreEntity {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  customDomain: string | null;
  logoUrl: string | null;
  status: StoreStatusValue;
  deactivationReason: string | null;
  owner: StoreOwnerEntity;
  createdAt: Date;
  updatedAt: Date;
}
