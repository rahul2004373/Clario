import { getStoredTokens, clearTokens } from "@/lib/auth/api";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

const FETCH_TIMEOUT = 15000;

export async function apiClient<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const { accessToken } = getStoredTokens();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options?.headers as Record<string, string>) },
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Something went wrong" }));

      if (res.status === 401) {
        clearTokens();
        throw new UnauthorizedError();
      }

      if (res.status === 403) {
        throw new ForbiddenError(body.error ?? "Forbidden");
      }

      throw new ApiError(body.error ?? "Something went wrong");
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}
