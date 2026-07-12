import { Injectable } from "@nestjs/common";
import { sessions, storeMembers, storeSettings, stores, storeThemeConfigurations, users } from "@brandcanvas/database";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import type { StoreEntity } from "../entities";
import type { StoreStatusCountDto } from "../dto";
import { StoreRepository, type CreateStorePersistenceInput, type StoreListInput, type StoreListResult } from "./store.repository";

interface StoreJoinRow {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  customDomain: string | null;
  logoUrl: string | null;
  status: StoreEntity["status"];
  deactivationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
}

const selection = {
  id: stores.id,
  name: stores.name,
  slug: stores.slug,
  subdomain: stores.subdomain,
  customDomain: stores.customDomain,
  logoUrl: stores.logoUrl,
  status: stores.status,
  deactivationReason: stores.deactivationReason,
  createdAt: stores.createdAt,
  updatedAt: stores.updatedAt,
  ownerId: users.id,
  ownerName: users.name,
  ownerEmail: users.email,
};

@Injectable()
export class DrizzleStoreRepository implements StoreRepository {
  constructor(private readonly database: DatabaseService) {}

  async getSummary(): Promise<StoreStatusCountDto> {
    const [row] = await this.database.db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${stores.status} = 'active')`,
        pending: sql<number>`count(*) filter (where ${stores.status} = 'pending')`,
        inactive: sql<number>`count(*) filter (where ${stores.status} = 'inactive')`,
        suspended: sql<number>`count(*) filter (where ${stores.status} = 'suspended')`,
        archived: sql<number>`count(*) filter (where ${stores.status} = 'archived')`,
      })
      .from(stores);

    return {
      total: Number(row?.total ?? 0),
      active: Number(row?.active ?? 0),
      pending: Number(row?.pending ?? 0),
      inactive: Number(row?.inactive ?? 0),
      suspended: Number(row?.suspended ?? 0),
      archived: Number(row?.archived ?? 0),
    };
  }

  async findMany(input: StoreListInput): Promise<StoreListResult> {
    const search = input.search?.trim();
    const conditions = [
      input.status ? eq(stores.status, input.status) : undefined,
      search ? or(ilike(stores.name, `%${search}%`), ilike(stores.subdomain, `%${search}%`), ilike(users.email, `%${search}%`)) : undefined,
    ].filter((condition): condition is NonNullable<typeof condition> => Boolean(condition));
    const where = conditions.length ? and(...conditions) : undefined;

    const [items, totalRows] = await Promise.all([
      this.database.db
        .select(selection)
        .from(stores)
        .innerJoin(users, eq(users.id, stores.ownerId))
        .where(where)
        .orderBy(desc(stores.createdAt))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize),
      this.database.db
        .select({ total: count() })
        .from(stores)
        .innerJoin(users, eq(users.id, stores.ownerId))
        .where(where),
    ]);

    return { items: items.map(this.toEntity), total: Number(totalRows[0]?.total ?? 0) };
  }

  async findById(storeId: string): Promise<StoreEntity | null> {
    const rows = await this.database.db
      .select(selection)
      .from(stores)
      .innerJoin(users, eq(users.id, stores.ownerId))
      .where(eq(stores.id, storeId))
      .limit(1);
    return rows[0] ? this.toEntity(rows[0]) : null;
  }

  async createWithOwner(input: CreateStorePersistenceInput): Promise<StoreEntity> {
    return this.database.db.transaction(async (tx) => {
      const [owner] = await tx
        .insert(users)
        .values({
          name: input.sellerName,
          email: input.sellerEmail.toLowerCase(),
          passwordHash: input.passwordHash,
          platformRole: "user",
          status: "active",
          mustChangePassword: true,
        })
        .returning();
      if (!owner) throw new Error("Failed to create seller account.");

      const [store] = await tx
        .insert(stores)
        .values({
          ownerId: owner.id,
          name: input.storeName,
          slug: input.slug,
          subdomain: input.subdomain,
          status: input.status,
        })
        .returning();
      if (!store) throw new Error("Failed to create store.");

      await tx.insert(storeMembers).values({ storeId: store.id, userId: owner.id, role: "owner" });
      await tx.insert(storeSettings).values({ storeId: store.id, displayName: store.name });
      await tx.insert(storeThemeConfigurations).values([
        { storeId: store.id, lifecycle: "draft" },
        {
          storeId: store.id,
          lifecycle: "published",
          publishedVersion: 1,
          publishedAt: new Date(),
        },
      ]);

      return this.toEntity({
        ...store,
        ownerId: owner.id,
        ownerName: owner.name,
        ownerEmail: owner.email,
      });
    });
  }

  async updateStatus(input: { storeId: string; status: StoreEntity["status"]; reason?: string; changedBy: string }): Promise<StoreEntity | null> {
    await this.database.db.transaction(async (tx) => {
      const isDisabled = ["inactive", "suspended", "archived"].includes(input.status);
      await tx
        .update(stores)
        .set({
          status: input.status,
          deactivationReason: isDisabled ? input.reason ?? null : null,
          deactivatedAt: isDisabled ? new Date() : null,
          deactivatedBy: isDisabled ? input.changedBy : null,
          updatedAt: new Date(),
        })
        .where(eq(stores.id, input.storeId));

      if (isDisabled) {
        await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.storeId, input.storeId));
      }
    });

    return this.findById(input.storeId);
  }

  private toEntity(row: StoreJoinRow): StoreEntity {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      subdomain: row.subdomain,
      customDomain: row.customDomain,
      logoUrl: row.logoUrl,
      status: row.status,
      deactivationReason: row.deactivationReason,
      owner: { id: row.ownerId, name: row.ownerName, email: row.ownerEmail },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
