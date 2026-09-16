import axios, { AxiosError } from 'axios';
import type { ApiError } from '../types/user';
import { useAuthStore } from '../stores/auth-store';

const baseURL = import.meta.env.VITE_API_URL ?? '';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError<ApiError>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
