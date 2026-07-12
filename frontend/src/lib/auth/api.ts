import { NotImplementedError, ApiError, type AuthResponse } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/auth`
  : "http://localhost:4000/api/auth";

/* ------------------------------------------------------------------ */
/*  Request / Response types                                           */
/* ------------------------------------------------------------------ */

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleAuthResponse {
  url: string;
}

export interface GetMeResponse {
  profile: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface SyncResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string;
}

/* ------------------------------------------------------------------ */
/*  Token helpers                                                      */
/* ------------------------------------------------------------------ */

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export function getStoredTokens(): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  if (typeof window === "undefined") return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  };
}

export function storeTokens(session: { access_token: string; refresh_token: string }): void {
  localStorage.setItem(ACCESS_KEY, session.access_token);
  localStorage.setItem(REFRESH_KEY, session.refresh_token);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function authHeaders(): Record<string, string> {
  const { accessToken } = getStoredTokens();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  return headers;
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Something went wrong" }));
    throw new ApiError(body.error ?? "Something went wrong");
  }
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/*  API functions                                                      */
/* ------------------------------------------------------------------ */

export async function signupWithEmail(data: SignupRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<AuthResponse>(res);
}

export async function loginWithEmail(data: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<AuthResponse>(res);
}

export async function getGoogleOAuthUrl(redirectUrl: string): Promise<GoogleAuthResponse> {
  const res = await fetch(`${BASE_URL}/google?redirectUrl=${encodeURIComponent(redirectUrl)}`, {
    method: "GET",
  });
  return handleResponse<GoogleAuthResponse>(res);
}

export async function syncUser(): Promise<SyncResponse> {
  const res = await fetch(`${BASE_URL}/sync`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse<SyncResponse>(res);
}

export async function getCurrentUser(): Promise<GetMeResponse> {
  const res = await fetch(`${BASE_URL}/me`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse<GetMeResponse>(res);
}

export async function updateProfile(data: UpdateProfileRequest): Promise<GetMeResponse> {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<GetMeResponse>(res);
}
