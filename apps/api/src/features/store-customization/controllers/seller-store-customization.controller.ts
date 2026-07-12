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
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
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
import { StoreCustomizationAccessGuard } from "../guards";
import { StoreCustomizationService } from "../services";

@ApiTags("Store Customization")
@ApiCookieAuth("brandcanvas_access")
@Roles("user")
@UseGuards(StoreCustomizationAccessGuard, CsrfGuard)
@Controller("seller/store-customization")
export class SellerStoreCustomizationController {
  constructor(private readonly service: StoreCustomizationService) {}

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
  publish(@CurrentUser() user: AuthenticatedUser) {
    return this.service.publish(user.storeId!);
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

  @Post("assets")
  @ApiOperation({ summary: "Register or update store asset metadata" })
  @ApiOkResponse({ type: StoreAssetResponseDto })
  upsertAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: RegisterStoreAssetDto,
  ) {
    return this.service.upsertAsset(user.storeId!, input);
  }

  @Delete("assets/:assetId")
  @ApiOkResponse({ type: StoreCustomizationMessageDto })
  removeAsset(
    @CurrentUser() user: AuthenticatedUser,
    @Param("assetId", ParseUUIDPipe) assetId: string,
  ) {
    return this.service.removeAsset(user.storeId!, assetId);
  }
}
