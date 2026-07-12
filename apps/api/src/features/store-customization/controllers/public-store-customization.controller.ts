import { Controller, Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../../common/decorators/public.decorator";
import { StoreSlugParamDto, StoreThemeResponseDto } from "../dto";
import { StoreCustomizationService } from "../services";

@ApiTags("Store Customization")
@Public()
@Controller("storefront/stores")
export class PublicStoreCustomizationController {
  constructor(private readonly service: StoreCustomizationService) {}

  @Get(":slug/theme")
  @ApiOperation({
    summary: "Read the current published theme for an active public storefront",
  })
  @ApiOkResponse({ type: StoreThemeResponseDto })
  getPublishedTheme(@Param() params: StoreSlugParamDto) {
    return this.service.getPublicPublishedTheme(params.slug);
  }
}
