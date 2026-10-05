import { apiClient, setAccessToken } from "./axios";
import { toast } from "../lib/toast";
import type {
  AuthResponse,
  LoginRequest,
  RefreshResponse,
  RegisterRequest,
} from "../types/auth";

export async function login(
  credentials: LoginRequest,
): Promise<AuthResponse> {
  const response = await toast.promise(
    apiClient.post<AuthResponse>("/api/auth/login", credentials),
    {
      loading: "جارٍ تسجيل الدخول…",
      success: "تم تسجيل الدخول بنجاح",
      error: "فشل تسجيل الدخول",
    },
  );
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function register(
  input: RegisterRequest,
): Promise<AuthResponse> {
  const response = await toast.promise(
    apiClient.post<AuthResponse>("/api/auth/register", input),
    {
      loading: "جارٍ إنشاء الحساب…",
      success: "تم إنشاء الحساب بنجاح",
      error: "فشل إنشاء الحساب",
    },
  );
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function refresh(): Promise<RefreshResponse> {
  const response = await apiClient.post<RefreshResponse>(
    "/api/auth/refresh",
  );
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await toast.promise(
      apiClient.post("/api/auth/logout").then(() => undefined),
      {
        loading: "جارٍ تسجيل الخروج…",
        success: "تم تسجيل الخروج",
        error: "فشل تسجيل الخروج",
      },
    );
  } finally {
    setAccessToken(null);
  }
}
