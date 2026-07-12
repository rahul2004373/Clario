export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthResponse {
  user: AuthUser;
  session: AuthSession;
}

export interface AuthErrorResponse {
  error: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export class NotImplementedError extends Error {
  constructor(public fn: string) {
    super(`${fn} is not implemented. Wire this with the real API when backend docs are available.`);
    this.name = "NotImplementedError";
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}
