import { Controller, Get, Headers, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "../../../common/decorators/public.decorator";
import { PublicCategoryListDto, PublicCollectionListDto, PublicProductDetailsDto, PublicProductListDto, PublicProductQueryDto, PublicStorefrontDto, PublicStorefrontHomeDto, StorefrontTenantQueryDto } from "../dto";
import { StorefrontService } from "../services";

@ApiTags("Public Storefront")
@Public()
@Controller("public/storefront")
export class StorefrontController {
  constructor(private readonly service: StorefrontService) {}
  @Get("resolve") @ApiOkResponse({ type: PublicStorefrontDto }) resolve(@Headers("host") host: string | undefined, @Query() query: StorefrontTenantQueryDto) { return this.service.resolve(host, query); }
  @Get("home") @ApiOkResponse({ type: PublicStorefrontHomeDto }) home(@Headers("host") host: string | undefined, @Query() query: StorefrontTenantQueryDto) { return this.service.home(host, query); }
  @Get("categories") @ApiOkResponse({ type: PublicCategoryListDto }) categories(@Headers("host") host: string | undefined, @Query() query: StorefrontTenantQueryDto) { return this.service.categories(host, query); }
  @Get("collections") @ApiOkResponse({ type: PublicCollectionListDto }) collections(@Headers("host") host: string | undefined, @Query() query: StorefrontTenantQueryDto) { return this.service.collections(host, query); }
  @Get("products") @ApiOkResponse({ type: PublicProductListDto }) products(@Headers("host") host: string | undefined, @Query() query: PublicProductQueryDto) { return this.service.products(host, query); }
  @Get("products/:productSlug") @ApiOkResponse({ type: PublicProductDetailsDto }) product(@Headers("host") host: string | undefined, @Query("storeSlug") storeSlug: string | undefined, @Param("productSlug") productSlug: string) { return this.service.product(host, storeSlug, productSlug); }
}
