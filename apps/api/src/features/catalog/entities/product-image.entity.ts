export interface ProductImageEntity {
  id: string;
  storeId: string;
  productId: string;
  variantId: string | null;
  storageProvider: string;
  storageKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  altText: string | null;
  position: number;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}
