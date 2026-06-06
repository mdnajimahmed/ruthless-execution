import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'MISSING_API_URL';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach stored access token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── token refresh + retry ───────────────────────────────────────────────────

let isRefreshing = false;
let waitingQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function drainQueue(error: unknown, token: string | null) {
  waitingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  waitingQueue = [];
}

interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableConfig;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request is already refreshing — queue this one
      return new Promise<string>((resolve, reject) => {
        waitingQueue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const storedRefreshToken = await SecureStore.getItemAsync('refresh_token');
    if (!storedRefreshToken) {
      // No refresh token — force logout
      const { useAuthStore } = await import('@/stores/authStore');
      await useAuthStore.getState().clearAuth();
      drainQueue(error, null);
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      const { refreshAccessToken } = await import('./auth');
      const { token, refreshToken } = await refreshAccessToken(storedRefreshToken);

      const { useAuthStore } = await import('@/stores/authStore');
      await useAuthStore.getState().updateTokens(token, refreshToken);

      original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
      drainQueue(null, token);
      isRefreshing = false;
      return apiClient(original);
    } catch (refreshError: any) {
      // Only wipe stored credentials when the server explicitly rejects the
      // refresh token (401). Network timeouts / 5xx errors are transient —
      // clearing valid tokens here would log the user out permanently.
      if (refreshError?.response?.status === 401) {
        const { useAuthStore } = await import('@/stores/authStore');
        await useAuthStore.getState().clearAuth();
      }
      drainQueue(refreshError, null);
      isRefreshing = false;
      return Promise.reject(refreshError);
    }
  },
);
