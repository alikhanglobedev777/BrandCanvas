import "reflect-metadata";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "../app.module";
import { createOpenApiDocument } from "./openapi";

async function generateOpenApi() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: false,
  });
  app.setGlobalPrefix("api/v1");
  await app.init();

  const document = createOpenApiDocument(app);
  const targetDirectory = resolve(process.cwd(), "../../packages/contracts/openapi");
  const targetFile = resolve(targetDirectory, "brandcanvas.openapi.json");

  await mkdir(targetDirectory, { recursive: true });
  await writeFile(targetFile, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  await app.close();

  console.log(`OpenAPI document generated at ${targetFile}`);
}

generateOpenApi().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
