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
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
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
import { StoreCustomizationAccessGuard } from "../guards";
import { StoreAssetService, StoreCustomizationService } from "../services";
import { readStoreAssetUpload } from "./read-store-asset-upload";

@ApiTags("Store Customization")
@ApiCookieAuth("brandcanvas_access")
@Roles("user")
@UseGuards(StoreCustomizationAccessGuard, CsrfGuard)
@Controller("seller/store-customization")
export class SellerStoreCustomizationController {
  constructor(
    private readonly service: StoreCustomizationService,
    private readonly assetService: StoreAssetService,
  ) {}

  @Get("settings")
  @ApiOperation({ summary: "Get settings for the authenticated seller store" })
  @ApiOkResponse({ type: StoreSettingsResponseDto })
  getSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getSettings(user.storeId!);
  }

  @Patch("settings")
  @ApiOperation({
    summary: "Update profile, contact information, and social links",
  })
  @ApiOkResponse({ type: StoreSettingsResponseDto })
  updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateStoreSettingsDto,
  ) {
    return this.service.updateSettings(user.storeId!, input);
  }

  @Get("theme/draft")
  @ApiOkResponse({ type: StoreThemeResponseDto })
  getDraft(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getDraft(user.storeId!);
  }

  @Put("theme/draft")
  @ApiOkResponse({ type: StoreThemeResponseDto })
  saveDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: SaveThemeDraftDto,
  ) {
    return this.service.saveDraft(user.storeId!, input);
  }

  @Get("theme/preview")
  @ApiOperation({
    summary: "Get draft theme data for preview without publishing",
  })
  @ApiOkResponse({ type: StoreThemeResponseDto })
  preview(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getPreview(user.storeId!);
  }

  @Post("theme/publish")
  @ApiOkResponse({ type: StoreThemeResponseDto })
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: PublishThemeDto,
  ) {
    return this.service.publish(user.storeId!, input);
  }

  @Get("theme/versions")
  @ApiOkResponse({ type: ThemeVersionListResponseDto })
  listVersions(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listVersions(user.storeId!);
  }

  @Post("theme/versions/:version/rollback")
  @ApiOkResponse({ type: StoreThemeResponseDto })
  rollback(
    @CurrentUser() user: AuthenticatedUser,
    @Param("version", ParseIntPipe) version: number,
  ) {
    return this.service.rollback(user.storeId!, version);
  }

  @Get("assets")
  @ApiOkResponse({ type: StoreAssetListResponseDto })
  listAssets(@CurrentUser() user: AuthenticatedUser) {
    return this.assetService.list(user.storeId!);
  }

  @Post("assets/:category/upload")
  @ApiConsumes("multipart/form-data")
  @ApiParam({ name: "category", enum: STORE_ASSET_CATEGORIES })
  @ApiBody({ type: UploadStoreAssetDto })
  @ApiCreatedResponse({ type: StoreAssetResponseDto })
  async uploadAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Param("category") category: string,
    @Req() request: FastifyRequest,
  ) {
    return this.assetService.upload(
      user.storeId!,
      category,
      await readStoreAssetUpload(request),
    );
  }

  @Delete("assets/:assetId")
  @ApiOkResponse({ type: StoreCustomizationMessageDto })
  removeAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Param("assetId", ParseUUIDPipe) assetId: string,
  ) {
    return this.assetService.remove(user.storeId!, assetId);
  }

}
