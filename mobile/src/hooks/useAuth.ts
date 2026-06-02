import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { login, verifyToken, forgotPassword } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import type { LoginRequest } from '@/types/auth';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: async (response) => {
      await setAuth(response.token, response.user.id, response.user.email);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => forgotPassword(email),
  });
}

export function useVerifyAndRestoreSession() {
  const { setAuth, clearAuth, restoreAuth } = useAuthStore();
  return async (): Promise<boolean> => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) return false;
    try {
      const user = await verifyToken();
      await setAuth(token, user.id, user.email);
      return true;
    } catch (error: any) {
      // Only force logout on explicit 401 — network errors keep the stored session
      if (error?.response?.status === 401) {
        await clearAuth();
        return false;
      }
      // Backend unreachable: restore from SecureStore optimistically
      return restoreAuth();
    }
  };
}
