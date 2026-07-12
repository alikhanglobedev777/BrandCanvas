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
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { ActiveStoreGuard } from "../../../common/guards/active-store.guard";
import { CsrfGuard } from "../../../common/guards/csrf.guard";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import {
  CatalogMessageDto,
  CategoryListResponseDto,
  CategoryQueryDto,
  CategoryResponseDto,
  CollectionListResponseDto,
  CollectionQueryDto,
  CollectionResponseDto,
  CreateCategoryDto,
  CreateCollectionDto,
  CreateProductOptionDto,
  CreateProductOptionValueDto,
  CreateProductVariantDto,
  ProductDetailsResponseDto,
  ProductIdsDto,
  ReorderCollectionProductsDto,
  UpdateCategoryDto,
  UpdateCollectionDto,
  UpdateProductDto,
  UpdateProductOptionDto,
  UpdateProductOptionValueDto,
  UpdateProductVariantDto,
} from "../dto";
import { CatalogPermissionGuard } from "../guards";
import { CatalogManagementService } from "../services";

@ApiTags("Seller Catalog")
@ApiCookieAuth("brandcanvas_access")
@Roles("user")
@UseGuards(ActiveStoreGuard, CatalogPermissionGuard, CsrfGuard)
@Controller("seller/catalog")
export class CatalogManagementController {
  constructor(private readonly service: CatalogManagementService) {}

  @Get("categories")
  @ApiOkResponse({ type: CategoryListResponseDto })
  listCategories(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CategoryQueryDto,
  ) {
    return this.service.listCategories(user.storeId!, query);
  }
  @Post("categories")
  @ApiCreatedResponse({ type: CategoryResponseDto })
  createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateCategoryDto,
  ) {
    return this.service.createCategory(user.storeId!, input);
  }
  @Get("categories/:categoryId")
  @ApiOkResponse({ type: CategoryResponseDto })
  getCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("categoryId", ParseUUIDPipe) id: string,
  ) {
    return this.service.getCategory(user.storeId!, id);
  }
  @Patch("categories/:categoryId")
  @ApiOkResponse({ type: CategoryResponseDto })
  updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("categoryId", ParseUUIDPipe) id: string,
    @Body() input: UpdateCategoryDto,
  ) {
    return this.service.updateCategory(user.storeId!, id, input);
  }
  @Post("categories/:categoryId/archive")
  @ApiOkResponse({ type: CategoryResponseDto })
  archiveCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("categoryId", ParseUUIDPipe) id: string,
  ) {
    return this.service.archiveCategory(user.storeId!, id);
  }
  @Post("categories/:categoryId/restore")
  @ApiOkResponse({ type: CategoryResponseDto })
  restoreCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("categoryId", ParseUUIDPipe) id: string,
  ) {
    return this.service.restoreCategory(user.storeId!, id);
  }

  @Get("collections")
  @ApiOkResponse({ type: CollectionListResponseDto })
  listCollections(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: CollectionQueryDto,
  ) {
    return this.service.listCollections(user.storeId!, query);
  }
  @Post("collections")
  @ApiCreatedResponse({ type: CollectionResponseDto })
  createCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateCollectionDto,
  ) {
    return this.service.createCollection(user.storeId!, input);
  }
  @Get("collections/:collectionId")
  @ApiOkResponse({ type: CollectionResponseDto })
  getCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) id: string,
  ) {
    return this.service.getCollection(user.storeId!, id);
  }
  @Patch("collections/:collectionId")
  @ApiOkResponse({ type: CollectionResponseDto })
  updateCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) id: string,
    @Body() input: UpdateCollectionDto,
  ) {
    return this.service.updateCollection(user.storeId!, id, input);
  }
  @Post("collections/:collectionId/archive")
  @ApiOkResponse({ type: CollectionResponseDto })
  archiveCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) id: string,
  ) {
    return this.service.archiveCollection(user.storeId!, id);
  }
  @Post("collections/:collectionId/restore")
  @ApiOkResponse({ type: CollectionResponseDto })
  restoreCollection(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) id: string,
  ) {
    return this.service.restoreCollection(user.storeId!, id);
  }
  @Post("collections/:collectionId/products")
  @ApiOkResponse({ type: CollectionResponseDto })
  addCollectionProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) id: string,
    @Body() input: ProductIdsDto,
  ) {
    return this.service.addCollectionProducts(
      user.storeId!,
      id,
      input.productIds,
    );
  }
  @Delete("collections/:collectionId/products")
  @ApiOkResponse({ type: CollectionResponseDto })
  removeCollectionProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) id: string,
    @Body() input: ProductIdsDto,
  ) {
    return this.service.removeCollectionProducts(
      user.storeId!,
      id,
      input.productIds,
    );
  }
  @Put("collections/:collectionId/products/order")
  @ApiOkResponse({ type: CollectionResponseDto })
  reorderCollectionProducts(
    @CurrentUser() user: AuthenticatedUser,
    @Param("collectionId", ParseUUIDPipe) id: string,
    @Body() input: ReorderCollectionProductsDto,
  ) {
    return this.service.reorderCollectionProducts(
      user.storeId!,
      id,
      input.productIds,
    );
  }

  @Get("products/:productId")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  getProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) id: string,
  ) {
    return this.service.getProduct(user.storeId!, id);
  }
  @Patch("products/:productId")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  updateProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) id: string,
    @Body() input: UpdateProductDto,
  ) {
    return this.service.updateProduct(user.storeId!, id, input);
  }
  @Post("products/:productId/archive")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  archiveProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) id: string,
  ) {
    return this.service.archiveProduct(user.storeId!, id);
  }
  @Post("products/:productId/restore")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  restoreProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) id: string,
  ) {
    return this.service.restoreProduct(user.storeId!, id);
  }

  @Post("products/:productId/options")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  createOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Body() input: CreateProductOptionDto,
  ) {
    return this.service.createOption(user.storeId!, productId, input);
  }
  @Patch("products/:productId/options/:optionId")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  updateOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("optionId", ParseUUIDPipe) optionId: string,
    @Body() input: UpdateProductOptionDto,
  ) {
    return this.service.updateOption(user.storeId!, productId, optionId, input);
  }
  @Delete("products/:productId/options/:optionId")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  deleteOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("optionId", ParseUUIDPipe) optionId: string,
  ) {
    return this.service.deleteOption(user.storeId!, productId, optionId);
  }
  @Post("products/:productId/options/:optionId/values")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  createOptionValue(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("optionId", ParseUUIDPipe) optionId: string,
    @Body() input: CreateProductOptionValueDto,
  ) {
    return this.service.createOptionValue(
      user.storeId!,
      productId,
      optionId,
      input,
    );
  }
  @Patch("products/:productId/option-values/:valueId")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  updateOptionValue(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("valueId", ParseUUIDPipe) valueId: string,
    @Body() input: UpdateProductOptionValueDto,
  ) {
    return this.service.updateOptionValue(
      user.storeId!,
      productId,
      valueId,
      input,
    );
  }
  @Delete("products/:productId/option-values/:valueId")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  deleteOptionValue(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("valueId", ParseUUIDPipe) valueId: string,
  ) {
    return this.service.deleteOptionValue(user.storeId!, productId, valueId);
  }
  @Post("products/:productId/variants")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  createVariant(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Body() input: CreateProductVariantDto,
  ) {
    return this.service.createVariant(
      user.storeId!,
      user.userId,
      productId,
      input,
    );
  }
  @Patch("products/:productId/variants/:variantId")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  updateVariant(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("variantId", ParseUUIDPipe) variantId: string,
    @Body() input: UpdateProductVariantDto,
  ) {
    return this.service.updateVariant(
      user.storeId!,
      user.userId,
      productId,
      variantId,
      input,
    );
  }
  @Post("products/:productId/variants/:variantId/archive")
  @ApiOkResponse({ type: ProductDetailsResponseDto })
  archiveVariant(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseUUIDPipe) productId: string,
    @Param("variantId", ParseUUIDPipe) variantId: string,
  ) {
    return this.service.archiveVariant(user.storeId!, productId, variantId);
  }
}
