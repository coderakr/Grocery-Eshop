import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import * as authApi from '../api/auth';
import { getStoredToken, setStoredToken } from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (input: {
    name?: string;
    phone?: string | null;
    address?: string | null;
    password?: string;
  }) => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    authApi
      .fetchMe()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedIn, token } = await authApi.login({ email, password });
    setStoredToken(token);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback<AuthContextValue['register']>(async (input) => {
    const { user: created, token } = await authApi.register(input);
    setStoredToken(token);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setStoredToken(null);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback<AuthContextValue['updateProfile']>(
    async (input) => {
      const updated = await authApi.updateProfile(input);
      setUser(updated);
      return updated;
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout, updateProfile }),
    [user, loading, login, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
