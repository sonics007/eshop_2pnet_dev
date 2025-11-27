'use client';

/**
 * AUTH MODULE - Admin Context
 *
 * Samostatný kontext pre admin autentifikáciu s podporou 2FA.
 * Nezávislý od zákazníckej autentifikácie.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AdminUser, AdminLoginCredentials, AuthResult } from '../types';

const STORAGE_KEY = 'eshop-admin-auth';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minút

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresTwoFactor: boolean;
  pendingEmail: string | null;
  login: (credentials: AdminLoginCredentials) => Promise<AuthResult>;
  verifyTwoFactor: (code: string) => Promise<AuthResult>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

interface StoredSession {
  admin: AdminUser;
  expiresAt: number;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  // Načítanie session z localStorage
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: StoredSession = JSON.parse(stored);

        // Kontrola expirácie
        if (session.expiresAt > Date.now()) {
          setAdmin(session.admin);
          // Predĺženie session pri aktivite
          const newSession: StoredSession = {
            admin: session.admin,
            expiresAt: Date.now() + SESSION_TIMEOUT
          };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
        } else {
          // Expirovaná session
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to restore admin auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const extendSession = useCallback((adminData: AdminUser) => {
    if (typeof window === 'undefined') return;

    const session: StoredSession = {
      admin: adminData,
      expiresAt: Date.now() + SESSION_TIMEOUT
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(async (credentials: AdminLoginCredentials): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setPendingEmail(credentials.email);
        return { success: false, requiresTwoFactor: true };
      }

      if (result.success && result.user) {
        setAdmin(result.user);
        extendSession(result.user);
        setRequiresTwoFactor(false);
        setPendingEmail(null);
        return { success: true, user: result.user };
      }

      return { success: false, error: result.error || 'Prihlásenie zlyhalo' };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Chyba pripojenia' };
    }
  }, [extendSession]);

  const verifyTwoFactor = useCallback(async (code: string): Promise<AuthResult> => {
    if (!pendingEmail) {
      return { success: false, error: 'Chýba email pre verifikáciu' };
    }

    try {
      const response = await fetch('/api/auth/admin/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code })
      });

      const result = await response.json();

      if (result.success && result.user) {
        setAdmin(result.user);
        extendSession(result.user);
        setRequiresTwoFactor(false);
        setPendingEmail(null);
        return { success: true, user: result.user };
      }

      return { success: false, error: result.error || 'Neplatný kód' };
    } catch (error) {
      console.error('2FA verification error:', error);
      return { success: false, error: 'Chyba pripojenia' };
    }
  }, [pendingEmail, extendSession]);

  const logout = useCallback(() => {
    setAdmin(null);
    setRequiresTwoFactor(false);
    setPendingEmail(null);
    clearSession();
  }, [clearSession]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!admin) return false;
    // Admin bez špecifikovaných permissions má všetky práva
    if (!admin.permissions || admin.permissions.length === 0) return true;
    return admin.permissions.includes(permission) || admin.permissions.includes('*');
  }, [admin]);

  // Auto-extend session pri aktivite
  useEffect(() => {
    if (!admin) return;

    const handleActivity = () => {
      extendSession(admin);
    };

    // Predĺžiť session pri kliknutí alebo klávesnici
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [admin, extendSession]);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: Boolean(admin),
        isLoading,
        requiresTwoFactor,
        pendingEmail,
        login,
        verifyTwoFactor,
        logout,
        hasPermission
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
