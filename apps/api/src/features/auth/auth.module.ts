import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { AuthRepository, DrizzleAuthRepository } from "./repositories";
import { AuthService, PasswordService, TokenService } from "./services";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    DrizzleAuthRepository,
    { provide: AuthRepository, useExisting: DrizzleAuthRepository },
  ],
  exports: [PasswordService, TokenService],
})
export class AuthModule {}
