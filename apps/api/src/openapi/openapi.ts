import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { INestApplication } from "@nestjs/common";

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("BrandCanvas API")
    .setDescription("Central API contract for the BrandCanvas multi-tenant commerce platform.")
    .setVersion("1.0.0")
    .addCookieAuth("brandcanvas_access", {
      type: "apiKey",
      in: "cookie",
    })
    .build();

  return SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) => `${controllerKey.replace(/Controller$/, "")}_${methodKey}`,
  });
}
