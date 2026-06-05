import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, refreshToken: string, userId: string, email: string) => Promise<void>;
  updateTokens: (token: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  restoreAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  userId: null,
  email: null,
  isAuthenticated: false,

  setAuth: async (token, refreshToken, userId, email) => {
    await Promise.all([
      SecureStore.setItemAsync('auth_token', token),
      SecureStore.setItemAsync('refresh_token', refreshToken),
      SecureStore.setItemAsync('auth_user', JSON.stringify({ userId, email })),
    ]);
    set({ token, refreshToken, userId, email, isAuthenticated: true });
  },

  updateTokens: async (token, refreshToken) => {
    await Promise.all([
      SecureStore.setItemAsync('auth_token', token),
      SecureStore.setItemAsync('refresh_token', refreshToken),
    ]);
    set({ token, refreshToken });
  },

  clearAuth: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync('auth_token'),
      SecureStore.deleteItemAsync('refresh_token'),
      SecureStore.deleteItemAsync('auth_user'),
    ]);
    set({ token: null, refreshToken: null, userId: null, email: null, isAuthenticated: false });
  },

  restoreAuth: async () => {
    const [token, refreshToken, userStr] = await Promise.all([
      SecureStore.getItemAsync('auth_token'),
      SecureStore.getItemAsync('refresh_token'),
      SecureStore.getItemAsync('auth_user'),
    ]);
    if (!token) return false;
    let userId: string | null = null;
    let email: string | null = null;
    if (userStr) {
      try {
        ({ userId, email } = JSON.parse(userStr));
      } catch {}
    }
    set({ token, refreshToken: refreshToken ?? null, userId, email, isAuthenticated: true });
    return true;
  },
}));
