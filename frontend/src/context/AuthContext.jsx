import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../utils/api";

/**
 * AuthContext — single source of truth for the authenticated user.
 *
 * Exposes:
 *   user        — safe user object { id, name, email, role, location } | null
 *   loading     — true while the initial /api/auth/me call is in-flight
 *   login(email, password)           → user object
 *   register(name, email, password, role, location) → user object
 *   logout()
 *   refreshUser()                    → refetch from /api/auth/me
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until first /me call resolves

  // ── Restore session on mount ─────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
    } catch {
      // 401 → not logged in, that's fine
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    return data.user;
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password, role, location) => {
    const data = await authApi.register({ name, email, password, role, location });
    setUser(data.user);
    return data.user;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — must be called inside AuthProvider */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
