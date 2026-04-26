'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserRole } from '@/lib/types';

interface AuthUser {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  balance: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
    requiresTwoFactor?: boolean;
    challengeId?: string;
    channel?: string;
    deliveredTo?: string;
    warning?: string;
  }>;
  completeTwoFactor: (challengeId: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendTwoFactor: (email: string) => Promise<{ success: boolean; error?: string; challengeId?: string; deliveredTo?: string; channel?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  displayName: string;
  phone?: string;
  countryCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return { success: false, error: errorData.error || `Server error: ${res.status}` };
      }

      const data = await res.json();

      if (data.success && data.requiresTwoFactor) {
        // Don't set user yet — caller must complete the second step.
        return {
          success: true,
          requiresTwoFactor: true,
          challengeId: data.challengeId,
          channel: data.channel,
          deliveredTo: data.deliveredTo,
          warning: data.warning,
        };
      }

      if (data.success) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Request timed out. Please try again.' };
      }
      console.error('[v0] Login error:', error);
      return { success: false, error: 'Unable to connect. Please check your connection.' };
    }
  };

  const completeTwoFactor = async (challengeId: string, code: string) => {
    try {
      const res = await fetch('/api/auth/login/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Verification failed' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const resendTwoFactor = async (email: string) => {
    try {
      const res = await fetch('/api/auth/login/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resend: true, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return {
          success: true,
          challengeId: data.challengeId,
          deliveredTo: data.deliveredTo,
          channel: data.channel,
        };
      }
      return { success: false, error: data.error || 'Could not resend code' };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return { success: false, error: errorData.error || `Server error: ${res.status}` };
      }

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: data.error || 'Registration failed' };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Request timed out. Please try again.' };
      }
      console.error('[v0] Registration error:', error);
      return { success: false, error: 'Unable to connect. Please check your connection.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        completeTwoFactor,
        resendTwoFactor,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
