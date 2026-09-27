import { api, unwrap } from './client';
import type { User } from '../types';

export interface AuthResponse {
  user: User;
  token: string;
}

export function login(input: { email: string; password: string }) {
  return unwrap<AuthResponse>(api.post('/auth/login', input));
}

export function register(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  return unwrap<AuthResponse>(api.post('/auth/register', input));
}

export function logout() {
  return unwrap<{ message: string }>(api.post('/auth/logout'));
}

export function fetchMe() {
  return unwrap<{ user: User }>(api.get('/auth/me')).then((data) => data.user);
}

export function updateProfile(input: {
  name?: string;
  phone?: string | null;
  address?: string | null;
  password?: string;
}) {
  return unwrap<{ user: User }>(api.patch('/auth/me', input)).then(
    (data) => data.user,
  );
}
