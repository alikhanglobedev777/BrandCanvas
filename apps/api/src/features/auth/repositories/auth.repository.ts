import type { PlatformRole } from "../../../common/types/authenticated-user";

export interface AuthUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  platformRole: PlatformRole;
  status: "active" | "blocked";
  mustChangePassword: boolean;
  storeId?: string;
  storeStatus?: "pending" | "active" | "inactive" | "suspended" | "archived";
}

export interface SessionRecord {
  id: string;
  userId: string;
  storeId: string | null;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export abstract class AuthRepository {
  abstract findUserForLogin(email: string): Promise<AuthUserRecord | null>;
  abstract findUserById(userId: string): Promise<AuthUserRecord | null>;
  abstract createSession(input: { userId: string; storeId?: string; refreshTokenHash: string; expiresAt: Date }): Promise<SessionRecord>;
  abstract findSession(sessionId: string): Promise<SessionRecord | null>;
  abstract rotateSession(sessionId: string, refreshTokenHash: string, expiresAt: Date): Promise<void>;
  abstract revokeSession(sessionId: string): Promise<void>;
  abstract updatePassword(userId: string, passwordHash: string): Promise<void>;
}
