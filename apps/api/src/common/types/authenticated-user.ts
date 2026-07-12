export type PlatformRole = "super_admin" | "user";

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  platformRole: PlatformRole;
  storeId?: string;
}
