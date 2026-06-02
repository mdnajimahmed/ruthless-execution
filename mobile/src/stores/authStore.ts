import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, userId: string, email: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  restoreAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  email: null,
  isAuthenticated: false,

  setAuth: async (token, userId, email) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({ token, userId, email, isAuthenticated: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ token: null, userId: null, email: null, isAuthenticated: false });
  },

  restoreAuth: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      set({ token, isAuthenticated: true });
      return true;
    }
    return false;
  },
}));
