import { ApiError } from "@brandcanvas/contracts";

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  return error instanceof ApiError ? error.message : fallback;
}
