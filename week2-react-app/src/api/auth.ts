import { apiClient } from './client';
import type { AuthResponse } from '../types/user';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
};

export async function login(payload: LoginPayload) {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', payload);
  return data;
}
