import { ApiError } from "@brandcanvas/contracts";

interface ValidationIssue {
  property?: string;
  constraints?: Record<string, string>;
  children?: ValidationIssue[];
}

interface ValidationPayload {
  code?: string;
  message?: string;
  details?: ValidationIssue[];
}

function isValidationIssue(value: unknown): value is ValidationIssue {
  return typeof value === "object" && value !== null;
}

function isValidationPayload(value: unknown): value is ValidationPayload {
  return typeof value === "object" && value !== null;
}

function collectValidationMessages(
  issue: ValidationIssue,
  parentPath: string,
  messages: Record<string, string>,
): void {
  const property = typeof issue.property === "string" ? issue.property : "";
  const path = property
    ? parentPath
      ? `${parentPath}.${property}`
      : property
    : parentPath;

  if (issue.constraints && path) {
    const [message] = Object.values(issue.constraints);
    if (message) {
      messages[path] = message;
    }
  }

  if (Array.isArray(issue.children)) {
    for (const child of issue.children) {
      if (isValidationIssue(child)) {
        collectValidationMessages(child, path, messages);
      }
    }
  }
}

export function getStoreCustomizationErrorCode(error: unknown): string | null {
  if (!(error instanceof ApiError) || !isValidationPayload(error.payload)) {
    return null;
  }

  return typeof error.payload.code === "string" ? error.payload.code : null;
}

export function isStoreCustomizationAccessError(error: unknown): boolean {
  const code = getStoreCustomizationErrorCode(error);

  return (
    code === "STORE_CUSTOMIZATION_FORBIDDEN" ||
    code === "STORE_ACCESS_DENIED" ||
    code === "STORE_INACTIVE"
  );
}

export function getStoreCustomizationValidationMessages(
  error: unknown,
): Record<string, string> {
  if (!(error instanceof ApiError) || !isValidationPayload(error.payload)) {
    return {};
  }

  if (!Array.isArray(error.payload.details)) {
    return {};
  }

  const messages: Record<string, string> = {};

  for (const detail of error.payload.details) {
    if (isValidationIssue(detail)) {
      collectValidationMessages(detail, "", messages);
    }
  }

  return messages;
}
