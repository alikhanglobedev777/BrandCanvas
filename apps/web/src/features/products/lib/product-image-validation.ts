const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
export const PRODUCT_IMAGE_MAX_BYTES = 5_000_000;

export function validateProductImageFile(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  const name = file.name.toLowerCase();
  if (
    !IMAGE_TYPES.includes(file.type.toLowerCase()) ||
    !IMAGE_EXTENSIONS.some((extension) => name.endsWith(extension))
  )
    return "Choose a JPEG, PNG, or WebP image. SVG files are not supported.";
  if (file.size > PRODUCT_IMAGE_MAX_BYTES)
    return "The image must be 5 MB or smaller.";
  if (file.size === 0) return "The selected image is empty.";
  return null;
}
