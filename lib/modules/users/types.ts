/**
 * USERS MODULE - Types
 *
 * Typy pre správu používateľov a 2FA
 */

export interface User {
  id: number;
  email: string;
  companyName: string;
  ico?: string | null;
  dic?: string | null;
  vatId?: string | null;
  role: 'user' | 'admin';
  twoFactorEnabled: boolean;
  createdAt: Date;
}

export interface UserListItem {
  id: number;
  email: string;
  companyName: string;
  role: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  companyName: string;
  ico?: string;
  dic?: string;
  vatId?: string;
  role?: 'user' | 'admin';
  twoFactorEnabled?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  companyName?: string;
  ico?: string | null;
  dic?: string | null;
  vatId?: string | null;
  role?: 'user' | 'admin';
  twoFactorEnabled?: boolean;
}

export interface TwoFASetupResponse {
  secret: string;
  otpauthUrl: string;
  twoFactorEnabled: boolean;
}

export interface TwoFAEnableInput {
  secret: string;
  code: string;
}

export interface UserAuthMethod {
  password: boolean;
  twoFactor: boolean;
}

export interface UsersListResponse {
  success: boolean;
  users?: UserListItem[];
  error?: string;
}

export interface UserResponse {
  success: boolean;
  user?: UserListItem;
  error?: string;
}

export interface TwoFAResponse {
  success: boolean;
  secret?: string;
  otpauthUrl?: string;
  message?: string;
  error?: string;
}
