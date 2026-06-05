import { apiClient, API_URL } from './client';
import type { LoginRequest, AuthResponse, VerifyResponse } from '@/types/auth';
import axios from 'axios';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', data);
  return res.data;
}

export async function verifyToken(): Promise<VerifyResponse> {
  const res = await apiClient.get<VerifyResponse>('/auth/verify');
  return res.data;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ token: string; refreshToken: string }> {
  // Use a plain axios call (not apiClient) to avoid the interceptor loop
  const res = await axios.post<{ token: string; refreshToken: string }>(
    `${API_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  return res.data;
}

export async function logout(refreshToken?: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function registerPushToken(
  token: string,
  platform: 'ios' | 'android',
  timezone: string,
): Promise<void> {
  await apiClient.post('/auth/push-token', { token, platform, timezone });
}
