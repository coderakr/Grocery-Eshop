import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiEnvelope } from '../types';

const TOKEN_KEY = 'gc_token';

export const api = axios.create({
  baseURL: import.meta.env.API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401 && getStoredToken()) {
      setStoredToken(null);
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>) {
  const { data } = await promise;
  return data.data;
}
