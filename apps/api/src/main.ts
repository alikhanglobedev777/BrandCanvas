import "reflect-metadata";
import fastifyCookie from "@fastify/cookie";
import { ValidationPipe } from "@nestjs/common";
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

  app.enableCors({
    origin: ["http://localhost:3000"],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
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

