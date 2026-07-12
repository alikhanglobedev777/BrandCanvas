import type { FastifyRequest } from "fastify";
import type { AuthenticatedUser } from "./authenticated-user";

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
}
