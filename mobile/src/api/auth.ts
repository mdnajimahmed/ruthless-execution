import { apiClient } from './client';
import type { LoginRequest, AuthResponse, VerifyResponse } from '@/types/auth';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', data);
  return res.data;
}

export async function verifyToken(): Promise<VerifyResponse> {
  const res = await apiClient.get<VerifyResponse>('/auth/verify');
  return res.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}
