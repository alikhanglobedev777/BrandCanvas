import { BadRequestException } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import type { UploadedStoreAssetInput } from "../services";

export async function readStoreAssetUpload(
  request: FastifyRequest,
): Promise<UploadedStoreAssetInput> {
  try {
    const file = await request.file();

    if (!file) {
      throw new BadRequestException({
        code: "STORE_ASSET_FILE_REQUIRED",
        message: "Choose an image file to upload.",
      });
    }

    const content = await file.toBuffer();
    if (file.file.truncated) {
      throw new BadRequestException({
        code: "STORE_ASSET_TOO_LARGE",
        message: "The uploaded image exceeds the configured size limit.",
      });
    }

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
      (error as { code?: unknown }).code === "FST_REQ_FILE_TOO_LARGE"
    ) {
      throw new BadRequestException({
        code: "STORE_ASSET_TOO_LARGE",
        message: "The uploaded image exceeds the configured size limit.",
      });
    }

    throw error;
  }
}
