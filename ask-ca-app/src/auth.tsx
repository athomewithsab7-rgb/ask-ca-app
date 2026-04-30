import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export type User = {
  id: string;
  name: string;
  email: string;
  is_premium: boolean;
  created_at: string;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  togglePremium: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const apiFetch = async (path: string, options: RequestInit = {}, token?: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BACKEND_URL}/api${path}`, { ...options, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  return data;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = async (t: string | null, u: User | null) => {
    if (t) await AsyncStorage.setItem('askca_token', t); else await AsyncStorage.removeItem('askca_token');
    if (u) await AsyncStorage.setItem('askca_user', JSON.stringify(u)); else await AsyncStorage.removeItem('askca_user');
  };

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('askca_token');
        const uStr = await AsyncStorage.getItem('askca_user');
        if (t && uStr) {
          setToken(t);
          setUser(JSON.parse(uStr));
          // verify
          try {
            const me = await apiFetch('/auth/me', {}, t);
            setUser(me);
            await persist(t, me);
          } catch {
            setToken(null); setUser(null);
            await persist(null, null);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(data.token); setUser(data.user);
    await persist(data.token, data.user);
  };
  const signUp = async (name: string, email: string, password: string) => {
    const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    setToken(data.token); setUser(data.user);
    await persist(data.token, data.user);
  };
  const signOut = async () => {
    setToken(null); setUser(null);
    await persist(null, null);
  };
  const togglePremium = async () => {
    if (!token) return;
    const u = await apiFetch('/auth/toggle-premium', { method: 'POST' }, token);
    setUser(u);
    await persist(token, u);
  };
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const u = await apiFetch('/auth/me', {}, token);
      setUser(u);
      await persist(token, u);
    } catch {}
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut, togglePremium, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
