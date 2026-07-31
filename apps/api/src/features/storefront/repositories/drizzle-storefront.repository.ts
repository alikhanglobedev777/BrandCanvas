import { Injectable } from "@nestjs/common";
import {
  collectionProducts,
  collections,
  inventoryItems,
  productCategories,
  productImages,
  productOptions,
  productOptionValues,
  products,
  productVariants,
  productVariantValues,
  storeAssets,
  storeDomains,
  storeSettings,
  stores,
  storeThemeConfigurations,
} from "@brandcanvas/database";
import { and, asc, count, desc, eq, ilike, inArray, lte, gte, or, sql } from "drizzle-orm";
import { DatabaseService } from "../../../infrastructure/database";
import type {
  PublicCategoryDto,
  PublicCollectionDto,
  PublicImageDto,
  PublicProductDetailsDto,
  PublicProductListDto,
  PublicProductQueryDto,
  PublicProductSummaryDto,
  PublicStockDto,
  PublicStorefrontDto,
} from "../dto";
import { StorefrontRepository } from "./storefront.repository";

const normalizeHost = (value?: string) => value?.trim().toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
const stock = (quantity: number, reserved: number, threshold: number): PublicStockDto => {
  const available = Math.max(0, quantity - reserved);
  return { status: available <= 0 ? "out_of_stock" : available <= threshold ? "low_stock" : "in_stock", availableForSale: available > 0 };
};

@Injectable()
export class DrizzleStorefrontRepository implements StorefrontRepository {
  constructor(private readonly database: DatabaseService) {}

  async resolve(input: { hostname?: string; storeSlug?: string; platformDomain: string }): Promise<PublicStorefrontDto | null> {
    const hostname = normalizeHost(input.hostname);
    const platformDomain = normalizeHost(input.platformDomain)!;
    let resolvedSlug = input.storeSlug?.trim().toLowerCase();
    let customStoreId: string | undefined;
    if (!resolvedSlug && hostname && hostname !== "localhost" && hostname !== platformDomain) {
      if (hostname.endsWith(`.${platformDomain}`)) resolvedSlug = hostname.slice(0, -(platformDomain.length + 1));
      else {
        const [domain] = await this.database.db.select({ storeId: storeDomains.storeId }).from(storeDomains).where(and(eq(storeDomains.normalizedHostname, hostname), eq(storeDomains.verificationStatus, "verified"))).limit(1);
        customStoreId = domain?.storeId;
      }
    }
    if (!resolvedSlug && !customStoreId) return null;
    const condition = customStoreId ? eq(stores.id, customStoreId) : eq(stores.slug, resolvedSlug!);
    const [row] = await this.database.db
      .select({
        storeId: stores.id,
        slug: stores.slug,
        name: storeSettings.displayName,
        description: storeSettings.description,
        currency: storeSettings.defaultCurrency,
        contactEmail: storeSettings.contactEmail,
        contactPhone: storeSettings.contactPhone,
        primaryColor: storeThemeConfigurations.primaryColor,
        secondaryColor: storeThemeConfigurations.secondaryColor,
        backgroundColor: storeThemeConfigurations.backgroundColor,
        textColor: storeThemeConfigurations.textColor,
        headingFont: storeThemeConfigurations.headingFont,
        bodyFont: storeThemeConfigurations.bodyFont,
        buttonRadius: storeThemeConfigurations.buttonRadius,
        cardRadius: storeThemeConfigurations.cardRadius,
        headerStyle: storeThemeConfigurations.headerStyle,
        footerStyle: storeThemeConfigurations.footerStyle,
        productCardStyle: storeThemeConfigurations.productCardStyle,
      })
      .from(stores)
      .innerJoin(storeSettings, eq(storeSettings.storeId, stores.id))
      .innerJoin(storeThemeConfigurations, and(eq(storeThemeConfigurations.storeId, stores.id), eq(storeThemeConfigurations.lifecycle, "published")))
      .where(and(condition, eq(stores.status, "active"), eq(stores.storefrontEnabled, true)))
      .limit(1);
    if (!row) return null;
    const assets = await this.database.db.select({ category: storeAssets.category, publicUrl: storeAssets.publicUrl }).from(storeAssets).where(and(eq(storeAssets.storeId, row.storeId), eq(storeAssets.isCurrent, true), inArray(storeAssets.category, ["logo", "favicon"])));
    const asset = (category: string) => assets.find((item) => item.category === category)?.publicUrl ?? null;
    return {
      storeId: row.storeId,
      slug: row.slug,
      name: row.name,
      description: row.description,
      currency: row.currency,
      logoUrl: asset("logo"),
      faviconUrl: asset("favicon"),
      contactEmail: row.contactEmail,
      contactPhone: row.contactPhone,
      theme: {
        primaryColor: row.primaryColor,
        secondaryColor: row.secondaryColor,
        backgroundColor: row.backgroundColor,
        textColor: row.textColor,
        headingFont: row.headingFont,
        bodyFont: row.bodyFont,
        buttonRadius: row.buttonRadius,
        cardRadius: row.cardRadius,
        headerStyle: row.headerStyle,
        footerStyle: row.footerStyle,
        productCardStyle: row.productCardStyle,
      },
    };
  }

  async listCategories(storeId: string): Promise<PublicCategoryDto[]> {
    return this.database.db.select({ id: productCategories.id, name: productCategories.name, slug: productCategories.slug, description: productCategories.description }).from(productCategories).where(and(eq(productCategories.storeId, storeId), eq(productCategories.status, "active"), sql`${productCategories.archivedAt} is null`)).orderBy(asc(productCategories.sortOrder), asc(productCategories.name));
  }

  async listCollections(storeId: string): Promise<PublicCollectionDto[]> {
    return this.database.db.select({ id: collections.id, title: collections.title, slug: collections.slug, description: collections.description }).from(collections).where(and(eq(collections.storeId, storeId), eq(collections.status, "published"), sql`${collections.archivedAt} is null`)).orderBy(asc(collections.sortOrder), asc(collections.title));
  }

  async listProducts(storeId: string, query: PublicProductQueryDto): Promise<PublicProductListDto> {
    const available = sql<number>`${inventoryItems.stockQuantity} - ${inventoryItems.reservedQuantity}`;
    const conditions = [eq(products.storeId, storeId), eq(products.status, "active"), sql`${products.archivedAt} is null`, eq(productVariants.isDefault, true), eq(productVariants.isActive, true), sql`${productVariants.archivedAt} is null`];
    if (query.search?.trim()) conditions.push(or(ilike(products.name, `%${query.search.trim()}%`), sql`${query.search.trim()} = any(${products.keywords})`)!);
    if (query.categorySlug) conditions.push(eq(productCategories.slug, query.categorySlug));
    if (query.collectionSlug) conditions.push(eq(collections.slug, query.collectionSlug));
    if (query.minPriceMinor !== undefined) conditions.push(gte(products.priceMinor, query.minPriceMinor));
    if (query.maxPriceMinor !== undefined) conditions.push(lte(products.priceMinor, query.maxPriceMinor));
    const where = and(...conditions);
    const orderBy = query.sort === "price_ascending" ? asc(products.priceMinor) : query.sort === "price_descending" ? desc(products.priceMinor) : query.sort === "name_ascending" ? asc(products.name) : query.sort === "name_descending" ? desc(products.name) : desc(products.createdAt);
    const base = this.database.db.select({ id: products.id, name: products.name, slug: products.slug, description: products.description, priceMinor: products.priceMinor, compareAtPriceMinor: products.compareAtPriceMinor, stockQuantity: inventoryItems.stockQuantity, reservedQuantity: inventoryItems.reservedQuantity, threshold: inventoryItems.lowStockThreshold }).from(products).innerJoin(productVariants, and(eq(productVariants.productId, products.id), eq(productVariants.storeId, storeId))).innerJoin(inventoryItems, eq(inventoryItems.variantId, productVariants.id)).leftJoin(productCategories, and(eq(productCategories.id, products.categoryId), eq(productCategories.storeId, storeId))).leftJoin(collectionProducts, and(eq(collectionProducts.productId, products.id), eq(collectionProducts.storeId, storeId))).leftJoin(collections, and(eq(collections.id, collectionProducts.collectionId), eq(collections.storeId, storeId)));
    const rows = await base.where(where).groupBy(products.id, productVariants.id, inventoryItems.id).orderBy(orderBy).limit(query.pageSize).offset((query.page - 1) * query.pageSize);
    const [totalRow] = await this.database.db.select({ total: count(sql`distinct ${products.id}`) }).from(products).innerJoin(productVariants, and(eq(productVariants.productId, products.id), eq(productVariants.storeId, storeId))).innerJoin(inventoryItems, eq(inventoryItems.variantId, productVariants.id)).leftJoin(productCategories, and(eq(productCategories.id, products.categoryId), eq(productCategories.storeId, storeId))).leftJoin(collectionProducts, and(eq(collectionProducts.productId, products.id), eq(collectionProducts.storeId, storeId))).leftJoin(collections, and(eq(collections.id, collectionProducts.collectionId), eq(collections.storeId, storeId))).where(where);
    const ids = rows.map((row) => row.id);
    const images = ids.length ? await this.database.db.select({ id: productImages.id, productId: productImages.productId, url: productImages.publicUrl, altText: productImages.altText, position: productImages.position, isPrimary: productImages.isPrimary }).from(productImages).where(and(eq(productImages.storeId, storeId), inArray(productImages.productId, ids), eq(productImages.isPrimary, true))) : [];
    const items: PublicProductSummaryDto[] = rows.map((row) => ({ ...row, primaryImage: images.find((image) => image.productId === row.id) ? this.image(images.find((image) => image.productId === row.id)!) : null, stock: stock(row.stockQuantity, row.reservedQuantity, row.threshold) }));
    const total = Number(totalRow?.total ?? 0);
    return { items, page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) };
  }

  async getProduct(storeId: string, slug: string): Promise<PublicProductDetailsDto | null> {
    const [row] = await this.database.db.select({ id: products.id, name: products.name, slug: products.slug, description: products.description, priceMinor: products.priceMinor, compareAtPriceMinor: products.compareAtPriceMinor, categoryName: productCategories.name, categorySlug: productCategories.slug, currency: storeSettings.defaultCurrency }).from(products).innerJoin(storeSettings, eq(storeSettings.storeId, products.storeId)).leftJoin(productCategories, eq(productCategories.id, products.categoryId)).where(and(eq(products.storeId, storeId), eq(products.slug, slug), eq(products.status, "active"), sql`${products.archivedAt} is null`)).limit(1);
    if (!row) return null;
    const [images, optionRows, valueRows, variants] = await Promise.all([
      this.database.db.select({ id: productImages.id, productId: productImages.productId, url: productImages.publicUrl, altText: productImages.altText, position: productImages.position, isPrimary: productImages.isPrimary }).from(productImages).where(and(eq(productImages.storeId, storeId), eq(productImages.productId, row.id))).orderBy(asc(productImages.position)),
      this.database.db.select({ id: productOptions.id, name: productOptions.name }).from(productOptions).where(and(eq(productOptions.storeId, storeId), eq(productOptions.productId, row.id))).orderBy(asc(productOptions.position)),
      this.database.db.select({ id: productOptionValues.id, optionId: productOptionValues.optionId, value: productOptionValues.value }).from(productOptionValues).where(and(eq(productOptionValues.storeId, storeId), eq(productOptionValues.productId, row.id))).orderBy(asc(productOptionValues.position)),
      this.database.db.select({ id: productVariants.id, title: productVariants.title, priceOverrideMinor: productVariants.priceOverrideMinor, compareAtPriceMinor: productVariants.compareAtPriceMinor, stockQuantity: inventoryItems.stockQuantity, reservedQuantity: inventoryItems.reservedQuantity, threshold: inventoryItems.lowStockThreshold }).from(productVariants).innerJoin(inventoryItems, eq(inventoryItems.variantId, productVariants.id)).where(and(eq(productVariants.storeId, storeId), eq(productVariants.productId, row.id), eq(productVariants.isActive, true), sql`${productVariants.archivedAt} is null`)).orderBy(desc(productVariants.isDefault), asc(productVariants.title)),
    ]);
    const variantIds = variants.map((variant) => variant.id);
    const links = variantIds.length ? await this.database.db.select({ variantId: productVariantValues.variantId, optionValueId: productVariantValues.optionValueId }).from(productVariantValues).where(and(eq(productVariantValues.storeId, storeId), inArray(productVariantValues.variantId, variantIds))) : [];
    const mappedVariants = variants.map((variant) => ({ id: variant.id, title: variant.title, priceMinor: variant.priceOverrideMinor ?? row.priceMinor, compareAtPriceMinor: variant.compareAtPriceMinor ?? row.compareAtPriceMinor, optionValueIds: links.filter((link) => link.variantId === variant.id).map((link) => link.optionValueId), stock: stock(variant.stockQuantity, variant.reservedQuantity, variant.threshold) }));
    const aggregateStock = mappedVariants.some((variant) => variant.stock.status === "in_stock") ? { status: "in_stock" as const, availableForSale: true } : mappedVariants.some((variant) => variant.stock.status === "low_stock") ? { status: "low_stock" as const, availableForSale: true } : { status: "out_of_stock" as const, availableForSale: false };
    return { ...row, primaryImage: images.find((image) => image.isPrimary) ? this.image(images.find((image) => image.isPrimary)!) : images[0] ? this.image(images[0]) : null, images: images.map((image) => this.image(image)), options: optionRows.map((option) => ({ ...option, values: valueRows.filter((value) => value.optionId === option.id).map(({ id, value }) => ({ id, value })) })), variants: mappedVariants, stock: aggregateStock };
  }

  private image(row: { id: string; url: string; altText: string | null; position: number; isPrimary: boolean }): PublicImageDto { return { id: row.id, url: row.url, altText: row.altText, position: row.position, isPrimary: row.isPrimary }; }
}
