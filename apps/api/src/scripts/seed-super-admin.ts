import "reflect-metadata";
import { config } from "dotenv";
import { resolve } from "node:path";
import { createDatabase, users } from "@brandcanvas/database";
import { eq } from "drizzle-orm";
import { hash, Algorithm } from "@node-rs/argon2";

config({ path: resolve(process.cwd(), "../../.env") });

async function seedSuperAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  const name = process.env.SUPER_ADMIN_NAME;
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!databaseUrl || !name || !email || !password) {
    throw new Error("DATABASE_URL and SUPER_ADMIN_* environment variables are required.");
  }

  const connection = createDatabase(databaseUrl);
  const existing = await connection.db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  const passwordHash = await hash(password, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });

  if (existing[0]) {
    await connection.db
      .update(users)
      .set({ name, passwordHash, platformRole: "super_admin", status: "active", mustChangePassword: true, updatedAt: new Date() })
      .where(eq(users.id, existing[0].id));
    console.log(`Updated super admin ${email}`);
  } else {
    await connection.db.insert(users).values({ name, email, passwordHash, platformRole: "super_admin", status: "active", mustChangePassword: true });
    console.log(`Created super admin ${email}`);
  }

  await connection.close();
}

void seedSuperAdmin();
