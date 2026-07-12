import { z } from "zod";

const jwtKeyRingSchema = z.string().transform((value, context): Record<string, string> => {
  try {
    const parsed = JSON.parse(value) as unknown;
    const result = z.record(z.string(), z.string().min(32)).safeParse(parsed);
    if (!result.success) throw new Error("Every JWT key must be at least 32 characters.");
    return result.data;
  } catch (error) {
    context.addIssue({ code: "custom", message: error instanceof Error ? error.message : "JWT_KEY_RING_JSON must be valid JSON." });
    return z.NEVER;
  }
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  COOKIE_SECRET: z.string().min(16),
  JWT_ACTIVE_KID: z.string().min(1),
  JWT_KEY_RING_JSON: jwtKeyRingSchema,
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).default(600),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  SUPER_ADMIN_NAME: z.string().min(2).default("BrandCanvas Admin"),
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string().min(12),
});

export type AppEnvironment = z.infer<typeof envSchema>;
export function validateEnvironment(config: Record<string, unknown>): AppEnvironment {
  const environment = envSchema.parse(config);
  if (!environment.JWT_KEY_RING_JSON[environment.JWT_ACTIVE_KID]) {
    throw new Error("JWT_ACTIVE_KID must exist in JWT_KEY_RING_JSON.");
  }
  return environment;
}
