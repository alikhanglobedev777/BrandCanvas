import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import { sql } from "drizzle-orm";
import { Public } from "./common/decorators/public.decorator";
import { DatabaseService } from "./infrastructure/database";
class HealthResponseDto{@ApiProperty({example:"ok"})status!:string;@ApiProperty({example:"brandcanvas-api"})service!:string;@ApiProperty()timestamp!:string;}
@ApiTags("Health")@Public()@Controller()export class AppController{constructor(private readonly database:DatabaseService){}@Get("health")@ApiOperation({summary:"Check API liveness"})@ApiOkResponse({type:HealthResponseDto})health():HealthResponseDto{return{status:"ok",service:"brandcanvas-api",timestamp:new Date().toISOString()}}@Get("ready")@ApiOperation({summary:"Check API readiness"})@ApiOkResponse({type:HealthResponseDto})async ready():Promise<HealthResponseDto>{try{await this.database.db.execute(sql`select 1`);return{status:"ok",service:"brandcanvas-api",timestamp:new Date().toISOString()}}catch{throw new ServiceUnavailableException({code:"SERVICE_NOT_READY",message:"Database connectivity check failed."})}}}
