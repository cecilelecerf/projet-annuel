import Constants from "expo-constants";
import * as tokenStorage from "./token-storage";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Sur le web (Expo web) `localhost` fonctionne comme sur le site web classique.
 * Sur un appareil physique via Expo Go, `localhost` pointe vers l'appareil
 * lui-même : on récupère l'IP locale utilisée par Metro pour joindre l'API
 * Docker exposée sur le même réseau. EXPO_PUBLIC_API_URL permet de forcer
 * une valeur (utile pour l'émulateur Android : 10.0.2.2).
 */
function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(":")[0];

  if (host && host !== "localhost" && host !== "127.0.0.1") {
    return `http://${host}:3001/api`;
  }

  return "http://localhost:3001/api";
}

const BASE_URL = resolveApiUrl();

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

let isRefreshing = false;
let refreshQueue: ((token: string) => void)[] = [];

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await tokenStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) throw new Error("Refresh failed");

  const data = await response.json();
  await tokenStorage.setItem("accessToken", data.accessToken);
  await tokenStorage.setItem("refreshToken", data.refreshToken);
  return data.accessToken;
};

const api = async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = await tokenStorage.getItem("accessToken");

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null as T;

  if (response.status === 401 && !endpoint.includes("/auth/")) {
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((newToken) => {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          };
          resolve(api<T>(endpoint, options));
        });
      });
    }

    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];

      return api<T>(endpoint, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    } catch {
      refreshQueue = [];
      await tokenStorage.clear();
      onUnauthorized?.();
      throw new ApiError(401, "Session expirée");
    } finally {
      isRefreshing = false;
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error ?? data?.message ?? "Erreur serveur",
      data?.errors,
    );
  }

  return data as T;
};

export const http = {
  get: <T>(endpoint: string) => api<T>(endpoint),

  post: <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body: unknown) =>
    api<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, body?: unknown) =>
    api<T>(endpoint, {
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
};
