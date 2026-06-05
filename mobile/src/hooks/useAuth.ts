import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { login, verifyToken, forgotPassword, logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import type { LoginRequest } from '@/types/auth';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: async (response) => {
      await setAuth(
        response.token,
        response.refreshToken,
        response.user.id,
        response.user.email,
      );
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => forgotPassword(email),
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return async () => {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    await logout(refreshToken ?? undefined);
    await clearAuth();
  };
}

export function useVerifyAndRestoreSession() {
  const { setAuth, clearAuth, restoreAuth } = useAuthStore();
  return async (): Promise<boolean> => {
    const hasToken = !!(await SecureStore.getItemAsync('auth_token'));
    if (!hasToken) return false;

    try {
      // The client interceptor auto-refreshes on 401, so this succeeds
      // even when the access token is expired, as long as the refresh token is valid.
      const { user } = await verifyToken();

      // Read tokens again — interceptor may have rotated them
      const token = (await SecureStore.getItemAsync('auth_token'))!;
      const refreshToken = (await SecureStore.getItemAsync('refresh_token')) ?? '';
      await setAuth(token, refreshToken, user.id, user.email);
      return true;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        // Both access AND refresh tokens are invalid/expired — must re-login
        await clearAuth();
        return false;
      }
      // Network unreachable — restore optimistically from SecureStore
      return restoreAuth();
    }
  };
}
