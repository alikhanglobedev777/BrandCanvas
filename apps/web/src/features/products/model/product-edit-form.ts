import type {
  ProductDetailsResponseDto,
  UpdateProductDto,
} from "@brandcanvas/contracts";
export interface ProductEditFormValues {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  costPriceMinor: number | null;
  barcode: string;
  keywords: string;
  status: ProductDetailsResponseDto["status"];
  collectionIds: string[];
}
export function productToForm(
  product: ProductDetailsResponseDto,
): ProductEditFormValues {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    categoryId: product.categoryId ?? "",
    priceMinor: product.priceMinor,
    compareAtPriceMinor: product.compareAtPriceMinor ?? null,
    costPriceMinor: product.costPriceMinor ?? null,
    barcode: product.barcode ?? "",
    keywords: product.keywords.join(", "),
    status: product.status,
    collectionIds: product.collectionIds,
  };
}
export function formToProduct(values: ProductEditFormValues): UpdateProductDto {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description.trim() || null,
    categoryId: values.categoryId || null,
    priceMinor: values.priceMinor,
    compareAtPriceMinor: values.compareAtPriceMinor,
    costPriceMinor: values.costPriceMinor,
    barcode: values.barcode.trim() || null,
    keywords: values.keywords
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    status: values.status,
    collectionIds: values.collectionIds,
  };
}
