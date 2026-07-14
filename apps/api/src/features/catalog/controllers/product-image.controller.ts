import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ActiveStoreGuard } from "../../../common/guards/active-store.guard";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import {
  ProductImageListResponseDto,
  ProductImageMessageDto,
  ProductImageResponseDto,
  ReorderProductImagesDto,
  UpdateProductImageDto,
  UploadProductImageDto,
} from "../dto";
import { CatalogPermissionGuard } from "../guards";
import { ProductImageService } from "../services";
import { readProductImageUpload } from "./read-product-image-upload";

@ApiTags("Seller Product Images")
@ApiCookieAuth("brandcanvas_access")
@Roles("user")
@UseGuards(ActiveStoreGuard, CatalogPermissionGuard, CsrfGuard)
@Controller("seller/catalog/products/:productId/images")
export class ProductImageController {
  constructor(private readonly service: ProductImageService) {}

  @Get()
  @ApiOkResponse({ type: ProductImageListResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
  ) {
    return this.service.list(user.storeId!, productId);
  }

  @Get(":imageId")
  @ApiOkResponse({ type: ProductImageResponseDto })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("imageId", ParseUUIDPipe) imageId: string,
  ) {
    return this.service.get(user.storeId!, productId, imageId);
  }

  @Post()
  @ApiOperation({ summary: "Upload and safely normalize a product image" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: UploadProductImageDto })
  @ApiCreatedResponse({ type: ProductImageResponseDto })
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Req() request: FastifyRequest,
  ) {
    return this.service.upload(
      user.storeId!,
      productId,
      await readProductImageUpload(request),
    );
  }

  @Patch(":imageId")
  @ApiOkResponse({ type: ProductImageResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("imageId", ParseUUIDPipe) imageId: string,
    @Body() input: UpdateProductImageDto,
  ) {
    return this.service.update(user.storeId!, productId, imageId, input);
  }

  @Put("order")
  @ApiOkResponse({ type: ProductImageListResponseDto })
  reorder(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Body() input: ReorderProductImagesDto,
  ) {
    return this.service.reorder(user.storeId!, productId, input.imageIds);
  }

  @Post(":imageId/primary")
  @ApiOkResponse({ type: ProductImageListResponseDto })
  setPrimary(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("imageId", ParseUUIDPipe) imageId: string,
  ) {
    return this.service.setPrimary(user.storeId!, productId, imageId);
  }

  @Delete(":imageId")
  @ApiOkResponse({ type: ProductImageMessageDto })
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("imageId", ParseUUIDPipe) imageId: string,
  ) {
    return this.service.delete(user.storeId!, productId, imageId);
  }
}
