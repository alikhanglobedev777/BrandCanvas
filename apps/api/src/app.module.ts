import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { validateEnvironment } from "./config/env.schema";
import { AccessTokenGuard } from "./common/guards/access-token.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { DatabaseModule } from "./infrastructure/database";
import { AuthModule } from "./features/auth";
import { StoresModule } from "./features/stores";
import { CatalogModule } from "./features/catalog";
import { StoreCustomizationModule } from "./features/store-customization";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AuthModule,
    StoresModule,
    CatalogModule,
    StoreCustomizationModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
