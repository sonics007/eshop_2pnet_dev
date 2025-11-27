'use client';

/**
 * AUTH MODULE - Customer Context
 *
 * Samostatný kontext pre zákaznícku autentifikáciu.
 * Nezávislý od admin autentifikácie.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { CustomerUser, LoginCredentials, RegisterData, AuthResult } from '../types';

const STORAGE_KEY = 'eshop-customer-auth';

interface CustomerAuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  logout: () => void;
  updateProfile: (data: Partial<CustomerUser>) => Promise<AuthResult>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Načítanie z localStorage pri štarte
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (error) {
      console.error('Failed to restore customer auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Uloženie do localStorage
  const persistUser = useCallback((userData: CustomerUser | null) => {
    if (typeof window === 'undefined') return;

    if (userData) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (result.success && result.user) {
        setUser(result.user);
        persistUser(result.user);
        return { success: true, user: result.user };
      }

      return { success: false, error: result.error || 'Prihlásenie zlyhalo' };
    } catch (error) {
      console.error('Customer login error:', error);
      return { success: false, error: 'Chyba pripojenia' };
    }
  }, [persistUser]);

  const register = useCallback(async (data: RegisterData): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success && result.user) {
        setUser(result.user);
        persistUser(result.user);
        return { success: true, user: result.user };
      }

      return { success: false, error: result.error || 'Registrácia zlyhala' };
    } catch (error) {
      console.error('Customer register error:', error);
      return { success: false, error: 'Chyba pripojenia' };
    }
  }, [persistUser]);

  const logout = useCallback(() => {
    setUser(null);
    persistUser(null);
  }, [persistUser]);

  const updateProfile = useCallback(async (data: Partial<CustomerUser>): Promise<AuthResult> => {
    if (!user) {
      return { success: false, error: 'Nie ste prihlásený' };
    }

    try {
      const response = await fetch('/api/auth/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: user.id })
      });

      const result = await response.json();

      if (result.success && result.user) {
        setUser(result.user);
        persistUser(result.user);
        return { success: true, user: result.user };
      }

      return { success: false, error: result.error || 'Aktualizácia zlyhala' };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Chyba pripojenia' };
    }
  }, [user, persistUser]);

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  }
  return context;
}
