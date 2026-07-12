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
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import {
  PublishThemeDto,
  SaveThemeDraftDto,
  STORE_ASSET_CATEGORIES,
  StoreAssetListResponseDto,
  StoreAssetResponseDto,
  StoreCustomizationMessageDto,
  StoreSettingsResponseDto,
  StoreThemeResponseDto,
  ThemeVersionListResponseDto,
  UploadStoreAssetDto,
  UpdateStoreSettingsDto,
} from "../dto";
import { StoreAssetService, StoreCustomizationService } from "../services";
import { readStoreAssetUpload } from "./read-store-asset-upload";

@ApiTags("Store Customization")
@ApiCookieAuth("brandcanvas_access")
@Roles("super_admin")
@UseGuards(CsrfGuard)
@Controller("admin/stores/:storeId/customization")
export class AdminStoreCustomizationController {
  constructor(
    private readonly service: StoreCustomizationService,
    private readonly assetService: StoreAssetService,
  ) {}

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
  publish(
    @Param("storeId", ParseUUIDPipe) storeId: string,
    @Body() input: PublishThemeDto,
  ) {
    return this.service.publish(storeId, input);
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

  @Get("assets")
  @ApiOkResponse({ type: StoreAssetListResponseDto })
  listAssets(@Param("storeId", ParseUUIDPipe) storeId: string) {
    return this.assetService.list(storeId);
  }

  @Post("assets/:category/upload")
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "category", enum: STORE_ASSET_CATEGORIES })
  @ApiBody({ type: UploadStoreAssetDto })
  @ApiCreatedResponse({ type: StoreAssetResponseDto })
  async uploadAsset(
    @Param("storeId", ParseUUIDPipe) storeId: string,
    @Param("category") category: string,
    @Req() request: FastifyRequest,
  ) {
    return this.assetService.upload(
      storeId,
      category,
      await readStoreAssetUpload(request),
    );
  }

  @Delete("assets/:assetId")
  @ApiOkResponse({ type: StoreCustomizationMessageDto })
  removeAsset(
    @Param("storeId", ParseUUIDPipe) storeId: string,
    @Param("assetId", ParseUUIDPipe) assetId: string,
  ) {
    return this.assetService.remove(storeId, assetId);
  }

}
