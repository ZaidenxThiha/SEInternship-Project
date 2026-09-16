import { apiClient } from './client';
import type { Role, User } from '../types/user';

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
};

export async function listUsers() {
  const { data } = await apiClient.get<{ data: User[] }>('/api/users');
  return data.data;
}

export async function getMe() {
  const { data } = await apiClient.get<{ data: User }>('/api/users/me');
  return data.data;
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const { data } = await apiClient.patch<{ data: User }>(`/api/users/${id}`, payload);
  return data.data;
}

export async function deleteUser(id: string) {
  await apiClient.delete(`/api/users/${id}`);
}
