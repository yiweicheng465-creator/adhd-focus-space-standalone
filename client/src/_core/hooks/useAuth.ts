/**
 * useAuth — real implementation backed by JWT cookie auth.
 * Fetches user from GET /api/auth/me on mount.
 * Returns { user, loading, isAuthenticated, login, logout }.
 */

import { useState, useEffect, useCallback } from "react";
import type { User } from "@/lib/auth";
import { getMe, login as authLogin, logout as authLogout } from "@/lib/auth";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(
  _options?: { redirectOnUnauthenticated?: boolean; redirectPath?: string }
): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMe();
      setUser(me);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : "Auth check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, name?: string): Promise<User> => {
    const u = await authLogin(email, name);
    setUser(u);
    setError(null);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refresh: fetchUser,
  };
}
