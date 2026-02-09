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
  user: User;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials),
  
  verify: () => api.get<{ user: User }>('/auth/verify'),
  
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, newPassword }),
};

// Token storage utilities
const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  get: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  remove: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
};
