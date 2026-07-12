import "reflect-metadata";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { SwaggerModule } from "@nestjs/swagger";
import { createOpenApiDocument } from "./openapi/openapi";
import type { AppEnvironment } from "./config/env.schema";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    rawBody: true,
  });

  const config = app.get<ConfigService<AppEnvironment, true>>(ConfigService);

  await app.register(fastifyCookie, {
    secret: config.getOrThrow<string>("COOKIE_SECRET"),
  });

  const assetStorageRoot = path.resolve(
    process.cwd(),
    config.get("STORE_ASSET_STORAGE_ROOT", { infer: true }),
  );
  await mkdir(assetStorageRoot, { recursive: true });

  await app.register(fastifyMultipart, {
    limits: {
      files: 1,
      fields: 0,
      parts: 1,
      fileSize: config.get("STORE_ASSET_MAX_BYTES", { infer: true }),
    },
  });

  await app.register(fastifyStatic, {
    root: assetStorageRoot,
    prefix: "/uploads/",
    decorateReply: false,
  });

  app.enableCors({
    origin: [config.get("WEB_ORIGIN", { infer: true })],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false, value: false },
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: "VALIDATION_FAILED",
          message: "Request validation failed.",
          details: errors,
        }),
    }),
  );

  app.setGlobalPrefix("api/v1");
  app.enableShutdownHooks();

  if (config.get("NODE_ENV", { infer: true }) !== "production") {
    SwaggerModule.setup("docs", app, () => createOpenApiDocument(app));
  }

  const port = config.get("API_PORT", { infer: true });
  const host = config.get("API_HOST", { infer: true });

  await app.listen(port, host);
  console.log(`BrandCanvas API running at http://localhost:${port}/api/v1`);
}

void bootstrap();
