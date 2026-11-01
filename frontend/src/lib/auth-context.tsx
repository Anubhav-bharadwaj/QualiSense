"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, TokenResponse } from "@/types";
import { api, setApiAccessToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  role: string | null;
  permissions: string[];
  loading: boolean;
  login: (email: string, password: string, remember_me?: boolean) => Promise<User>;
  register: (fullName: string, email: string, password: string, organisation?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  const checkAuth = useCallback(async () => {
    try {
      // First try /api/auth/me using existing cookie or localStorage token
      const me = await api.getMe();
      setUser(me);
    } catch {
      // If token expired, attempt token refresh via HTTP-only cookie
      try {
        const refreshRes = await api.refreshToken();
        if (refreshRes && refreshRes.access_token) {
          setApiAccessToken(refreshRes.access_token);
          setUser(refreshRes.user);
        } else {
          setUser(null);
          setApiAccessToken(null);
        }
      } catch {
        setUser(null);
        setApiAccessToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string, remember_me: boolean = false) => {
    setLoading(true);
    try {
      const res: TokenResponse = await api.login({ email, password, remember_me });
      setApiAccessToken(res.access_token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string, organisation?: string) => {
    setLoading(true);
    try {
      const res: TokenResponse = await api.register({
        full_name: fullName,
        email,
        password,
        organisation,
      });
      setApiAccessToken(res.access_token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setApiAccessToken(null);
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  const refreshUser = async () => {
    try {
      const me = await api.getMe();
      setUser(me);
    } catch (e) {
      console.warn("Could not refresh user state:", e);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === "Administrator") return true;
    return Array.isArray(user.permissions) && user.permissions.includes(permission);
  };

  const hasRole = (targetRole: string | string[]): boolean => {
    if (!user) return false;
    if (Array.isArray(targetRole)) {
      return targetRole.includes(user.role);
    }
    return user.role === targetRole;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        permissions: user?.permissions || [],
        loading,
        login,
        register,
        logout,
        refreshUser,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
