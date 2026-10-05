import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  (import.meta.env?.VITE_API_URL as string | undefined) ??
  "http://localhost:4000";
const ACCESS_TOKEN_KEY = "crm.accessToken";
const REQUEST_TIMEOUT_MS = 10_000;
const REFRESH_ENDPOINT = "/api/auth/refresh";
const PUBLIC_AUTH_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/register",
  REFRESH_ENDPOINT,
];

export const API_BASE = API_BASE_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token === null) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];
let sessionExpiredHandler: (() => void) | null = null;

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach((promise) => {
    if (error !== null || token === null) {
      promise.reject(error);
      return;
    }
    promise.resolve(token);
  });
  failedQueue = [];
}

export function onSessionExpired(handler: () => void): void {
  sessionExpiredHandler = handler;
}

function handleSessionExpired(): void {
  setAccessToken(null);
  if (sessionExpiredHandler !== null) {
    sessionExpiredHandler();
    return;
  }
  window.location.assign("/login");
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token !== null) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response === undefined) {
      console.error(
        "[api] request failed:",
        error.code ?? "network",
        error.message,
      );
    } else if (error.response.status >= 500) {
      console.error(
        "[api] server error:",
        error.response.status,
        error.config?.method?.toUpperCase(),
        error.config?.url,
        error.response.data,
      );
    }
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";

    if (
      error.response?.status !== 401 ||
      originalRequest === undefined ||
      originalRequest._retry === true ||
      PUBLIC_AUTH_ENDPOINTS.includes(requestUrl)
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.set("Authorization", `Bearer ${token}`);
          return apiClient(originalRequest);
        })
        .catch((queueError: unknown) => Promise.reject(queueError));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await apiClient.post<{ accessToken: string }>(
        REFRESH_ENDPOINT,
      );
      setAccessToken(response.data.accessToken);
      processQueue(null, response.data.accessToken);
      originalRequest.headers.set(
        "Authorization",
        `Bearer ${response.data.accessToken}`,
      );
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      handleSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export function getApiErrorMessage(error: unknown): string {
  const candidate = error as {
    response?: { data?: { error?: { message?: string } } };
  };
  return (
    candidate?.response?.data?.error?.message ??
    "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."
  );
}
