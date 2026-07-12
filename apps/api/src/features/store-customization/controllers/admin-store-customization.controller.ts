import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import {
  RegisterStoreAssetDto,
  SaveThemeDraftDto,
  StoreAssetResponseDto,
  StoreCustomizationMessageDto,
  StoreSettingsResponseDto,
  StoreThemeResponseDto,
  ThemeVersionListResponseDto,
  UpdateStoreSettingsDto,
} from "../dto";
import { StoreCustomizationService } from "../services";

@ApiTags("Store Customization")
@ApiCookieAuth("brandcanvas_access")
@Roles("super_admin")
@UseGuards(CsrfGuard)
@Controller("admin/stores/:storeId/customization")
export class AdminStoreCustomizationController {
  constructor(private readonly service: StoreCustomizationService) {}

  @Get("settings")
  @ApiOperation({ summary: "Read settings for an explicitly selected store" })
  @ApiOkResponse({ type: StoreSettingsResponseDto })
  getSettings(@Param("storeId", ParseUUIDPipe) storeId: string) {
    return this.service.getSettings(storeId);
  }

  @Patch("settings")
  @ApiOkResponse({ type: StoreSettingsResponseDto })
  updateSettings(
    @Param("storeId", ParseUUIDPipe) storeId: string,
    @Body() input: UpdateStoreSettingsDto,
  ) {
    return this.service.updateSettings(storeId, input);
  }

  @Get("theme/draft")
  @ApiOkResponse({ type: StoreThemeResponseDto })
  getDraft(@Param("storeId", ParseUUIDPipe) storeId: string) {
    return this.service.getDraft(storeId);
  }

  @Put("theme/draft")
  @ApiOkResponse({ type: StoreThemeResponseDto })
  saveDraft(
    @Param("storeId", ParseUUIDPipe) storeId: string,
    @Body() input: SaveThemeDraftDto,
  ) {
    return this.service.saveDraft(storeId, input);
  }

  @Get("theme/preview")
  @ApiOkResponse({ type: StoreThemeResponseDto })
  preview(@Param("storeId", ParseUUIDPipe) storeId: string) {
    return this.service.getPreview(storeId);
  }

  @Post("theme/publish")
  @ApiOkResponse({ type: StoreThemeResponseDto })
  publish(@Param("storeId", ParseUUIDPipe) storeId: string) {
    return this.service.publish(storeId);
  }

  @Get("theme/versions")
  @ApiOkResponse({ type: ThemeVersionListResponseDto })
  listVersions(@Param("storeId", ParseUUIDPipe) storeId: string) {
    return this.service.listVersions(storeId);
  }

  @Post("theme/versions/:version/rollback")
  @ApiOkResponse({ type: StoreThemeResponseDto })
  rollback(
    @Param("storeId", ParseUUIDPipe) storeId: string,
    @Param("version", ParseIntPipe) version: number,
  ) {
    return this.service.rollback(storeId, version);
  }

  @Post("assets")
  @ApiOkResponse({ type: StoreAssetResponseDto })
  upsertAsset(
    @Param("storeId", ParseUUIDPipe) storeId: string,
    @Body() input: RegisterStoreAssetDto,
  ) {
    return this.service.upsertAsset(storeId, input);
  }

  @Delete("assets/:assetId")
  @ApiOkResponse({ type: StoreCustomizationMessageDto })
  removeAsset(
    @Param("storeId", ParseUUIDPipe) storeId: string,
    @Param("assetId", ParseUUIDPipe) assetId: string,
  ) {
    return this.service.removeAsset(storeId, assetId);
  }
}
