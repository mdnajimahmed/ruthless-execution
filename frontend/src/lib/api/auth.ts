import { api } from './config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials),

  verify: () => api.get<{ user: User }>('/auth/verify'),

  refresh: (refreshToken: string) =>
    api.post<{ token: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  logout: (refreshToken?: string) =>
    api.post<void>('/auth/logout', { refreshToken }).catch(() => {}),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, newPassword }),
};

const ACCESS_KEY  = 'auth_token';
const REFRESH_KEY = 'refresh_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(ACCESS_KEY),
  set: (token: string): void => { localStorage.setItem(ACCESS_KEY, token); },
  remove: (): void => { localStorage.removeItem(ACCESS_KEY); },

  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string): void => { localStorage.setItem(REFRESH_KEY, token); },
  removeRefresh: (): void => { localStorage.removeItem(REFRESH_KEY); },

  clear: (): void => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
