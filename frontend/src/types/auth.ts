export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
