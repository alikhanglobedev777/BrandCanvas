import { ApiError } from "./api-error";
import { getCsrfToken } from "./csrf";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
let refreshPromise: Promise<boolean> | null = null;

function resolveUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedBase = apiBaseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedBase.endsWith("/api/v1") && normalizedPath.startsWith("/api/v1/")) {
    return `${normalizedBase}${normalizedPath.slice("/api/v1".length)}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

function createHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers);
  const csrfToken = getCsrfToken();

  if (options.body && !headers.has("content-type") && !(options.body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }

  if (csrfToken && !headers.has("x-csrf-token")) {
    headers.set("x-csrf-token", csrfToken);
  }

  return headers;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(resolveUrl("/api/v1/auth/refresh"), {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetcher<T>(url: string, options: RequestInit): Promise<T> {
  const execute = () =>
    fetch(resolveUrl(url), {
      ...options,
      headers: createHeaders(options),
      credentials: "include",
    });

  let response = await execute();
  const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/refresh");

  if (response.status === 401 && !isAuthEndpoint && (await refreshAccessToken())) {
    response = await execute();
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

export type ErrorType<TError> = ApiError<TError>;
export type BodyType<TBody> = TBody;
