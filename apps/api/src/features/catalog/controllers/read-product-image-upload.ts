import { BadRequestException } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import type { UploadedProductImageInput } from "../services/product-image.service";

export async function readProductImageUpload(
  request: FastifyRequest,
): Promise<UploadedProductImageInput> {
  try {
    const file = await request.file();
    if (!file)
      throw new BadRequestException({
        code: "INVALID_IMAGE",
        message: "Choose an image to upload.",
      });
    const content = await file.toBuffer();
    if (file.file.truncated)
      throw new BadRequestException({
        code: "IMAGE_TOO_LARGE",
        message: "The uploaded image exceeds the configured size limit.",
      });
    return {
      originalFilename: file.filename,
      declaredMimeType: file.mimetype,
      content,
    };
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "FST_REQ_FILE_TOO_LARGE"
    )
      throw new BadRequestException({
        code: "IMAGE_TOO_LARGE",
        message: "The uploaded image exceeds the configured size limit.",
      });
    throw error;
  }
}
