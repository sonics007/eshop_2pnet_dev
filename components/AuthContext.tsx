'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type AuthUser = {
  companyName: string;
  ico: string;
  dic: string;
  vatId?: string;
  email: string;
  role: 'user' | 'admin';
  twoFactorEnabled?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (data: AuthUser) => void;
  logout: () => void;
};

const storageKey = 'eshop-auth-user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = (data: AuthUser) => {
    setUser(data);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
