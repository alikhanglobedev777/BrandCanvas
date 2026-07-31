import "reflect-metadata";
import fastifyCookie from "@fastify/cookie";
import fastifyHelmet from "@fastify/helmet";
import fastifyMultipart from "@fastify/multipart";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { BadRequestException, Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { SwaggerModule } from "@nestjs/swagger";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { AppModule } from "./app.module";
import type { AppEnvironment } from "./config/env.schema";
import { createOpenApiDocument } from "./openapi/openapi";

async function bootstrap() {
  const bootstrapConfig = {
    logger: true,
    trustProxy: process.env.TRUST_PROXY === "true",
  };
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(bootstrapConfig),
    { rawBody: true },
  );
  const config = app.get<ConfigService<AppEnvironment, true>>(ConfigService);

  const rateLimitMax = config.getOrThrow<number>("RATE_LIMIT_MAX");
  const rateLimitWindowMs = config.getOrThrow<number>("RATE_LIMIT_WINDOW_MS");
  const assetStorageRootConfig = config.getOrThrow<string>(
    "STORE_ASSET_STORAGE_ROOT",
  );
  const assetMaxBytes = config.getOrThrow<number>("STORE_ASSET_MAX_BYTES");
  const apiPort = config.getOrThrow<number>("API_PORT");
  const apiHost = config.getOrThrow<string>("API_HOST");
  const webOrigins =
    config.get<string>("WEB_ORIGINS") ??
    config.getOrThrow<string>("WEB_ORIGIN");

  await app.register(fastifyCookie, {
    secret: config.getOrThrow<string>("COOKIE_SECRET"),
  });
  await app.register(fastifyHelmet, {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
      },
    },
  });
  await app.register(fastifyRateLimit, {
    max: rateLimitMax,
    timeWindow: rateLimitWindowMs,
    keyGenerator: (request) => request.ip,
  });

  const assetStorageRoot = path.resolve(process.cwd(), assetStorageRootConfig);
  await mkdir(assetStorageRoot, { recursive: true });
  await app.register(fastifyMultipart, {
    limits: {
      files: 1,
      fields: 0,
      parts: 1,
      fileSize: assetMaxBytes,
    },
  });
  await app.register(fastifyStatic, {
    root: assetStorageRoot,
    prefix: "/uploads/",
    decorateReply: false,
  });

  const origins = webOrigins
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
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

  if (config.getOrThrow<AppEnvironment["NODE_ENV"]>("NODE_ENV") !== "production") {
    SwaggerModule.setup("docs", app, () => createOpenApiDocument(app));
  }

  await app.listen(apiPort, apiHost);
  new Logger("Bootstrap").log(`BrandCanvas API started on ${apiHost}:${apiPort}`);
}

void bootstrap();
