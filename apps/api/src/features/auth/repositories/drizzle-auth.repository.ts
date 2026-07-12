import { Injectable } from "@nestjs/common";
import { sessions, storeMembers, stores, users } from "@brandcanvas/database";
import { and, eq, isNull } from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import { AuthRepository, type AuthUserRecord, type SessionRecord } from "./auth.repository";

@Injectable()
export class DrizzleAuthRepository implements AuthRepository {
  constructor(private readonly database: DatabaseService) {}

  async findUserForLogin(email: string): Promise<AuthUserRecord | null> {
    const rows = await this.database.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        platformRole: users.platformRole,
        status: users.status,
        mustChangePassword: users.mustChangePassword,
        storeId: stores.id,
        storeStatus: stores.status,
      })
      .from(users)
      .leftJoin(storeMembers, eq(storeMembers.userId, users.id))
      .leftJoin(stores, eq(stores.id, storeMembers.storeId))
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      platformRole: row.platformRole,
      status: row.status,
      mustChangePassword: row.mustChangePassword,
      ...(row.storeId ? { storeId: row.storeId } : {}),
      ...(row.storeStatus ? { storeStatus: row.storeStatus } : {}),
    };
  }

  async findUserById(userId: string): Promise<AuthUserRecord | null> {
    const rows = await this.database.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        platformRole: users.platformRole,
        status: users.status,
        mustChangePassword: users.mustChangePassword,
        storeId: stores.id,
        storeStatus: stores.status,
      })
      .from(users)
      .leftJoin(storeMembers, eq(storeMembers.userId, users.id))
      .leftJoin(stores, eq(stores.id, storeMembers.storeId))
      .where(eq(users.id, userId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.passwordHash,
      platformRole: row.platformRole,
      status: row.status,
      mustChangePassword: row.mustChangePassword,
      ...(row.storeId ? { storeId: row.storeId } : {}),
      ...(row.storeStatus ? { storeStatus: row.storeStatus } : {}),
    };
  }

  async createSession(input: { userId: string; storeId?: string; refreshTokenHash: string; expiresAt: Date }): Promise<SessionRecord> {
    const [session] = await this.database.db
      .insert(sessions)
      .values({
        userId: input.userId,
        ...(input.storeId ? { storeId: input.storeId } : {}),
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
      })
      .returning();

    if (!session) throw new Error("Failed to create session.");
    return session;
  }

  async findSession(sessionId: string): Promise<SessionRecord | null> {
    const rows = await this.database.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)))
      .limit(1);
    return rows[0] ?? null;
  }

  async rotateSession(sessionId: string, refreshTokenHash: string, expiresAt: Date): Promise<void> {
    await this.database.db.update(sessions).set({ refreshTokenHash, expiresAt }).where(eq(sessions.id, sessionId));
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.database.db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.database.db
      .update(users)
      .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}
