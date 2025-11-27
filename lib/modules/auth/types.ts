/**
 * AUTH MODULE - Shared Types
 *
 * Zdieľané typy pre zákaznícku aj admin autentifikáciu
 */

export type UserRole = 'customer' | 'admin';

export interface BaseUser {
  id: number;
  email: string;
  role: UserRole;
  createdAt?: Date;
}

export interface CustomerUser extends BaseUser {
  role: 'customer';
  companyName: string;
  ico?: string;
  dic?: string;
  vatId?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  name: string;
  twoFactorEnabled: boolean;
  permissions?: string[];
}

export type AuthUser = CustomerUser | AdminUser;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AdminLoginCredentials extends LoginCredentials {
  otpCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  companyName: string;
  ico: string;
  dic: string;
  vatId?: string;
  phone?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  requiresTwoFactor?: boolean;
}

export interface SessionData {
  userId: number;
  role: UserRole;
  expiresAt: number;
}
