import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppEnvironment } from "../../../config/env.schema";
import type { PublicProductQueryDto, StorefrontTenantQueryDto } from "../dto";
import { StorefrontRepository } from "../repositories";

@Injectable()
export class StorefrontService {
  constructor(private readonly repository: StorefrontRepository, private readonly config: ConfigService<AppEnvironment, true>) {}

  async resolve(hostname: string | undefined, query: StorefrontTenantQueryDto) {
    const storefront = await this.repository.resolve({ hostname, storeSlug: query.storeSlug, platformDomain: this.config.get("PLATFORM_DOMAIN", { infer: true }) });
    if (!storefront) throw new NotFoundException({ code: "STOREFRONT_NOT_FOUND", message: "Storefront not found or unavailable." });
    return storefront;
  }
  async home(hostname: string | undefined, query: StorefrontTenantQueryDto) {
    const storefront = await this.resolve(hostname, query);
    const [categories, collections, products] = await Promise.all([this.repository.listCategories(storefront.storeId), this.repository.listCollections(storefront.storeId), this.repository.listProducts(storefront.storeId, Object.assign(new (class { page=1; pageSize=8; sort="newest" as const; })(), query))]);
    return { storefront, categories, collections, featuredProducts: products.items };
  }
  async categories(hostname: string | undefined, query: StorefrontTenantQueryDto) { const storefront = await this.resolve(hostname, query); return { items: await this.repository.listCategories(storefront.storeId) }; }
  async collections(hostname: string | undefined, query: StorefrontTenantQueryDto) { const storefront = await this.resolve(hostname, query); return { items: await this.repository.listCollections(storefront.storeId) }; }
  async products(hostname: string | undefined, query: PublicProductQueryDto) { const storefront = await this.resolve(hostname, query); return this.repository.listProducts(storefront.storeId, query); }
  async product(hostname: string | undefined, storeSlug: string | undefined, productSlug: string) { const storefront = await this.resolve(hostname, { storeSlug }); const product = await this.repository.getProduct(storefront.storeId, productSlug); if (!product) throw new NotFoundException({ code: "PRODUCT_NOT_FOUND", message: "Product not found." }); return product; }
}
