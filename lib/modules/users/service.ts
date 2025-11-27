/**
 * USERS MODULE - Service
 *
 * Biznis logika pre správu používateľov
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import type {
  UserListItem,
  CreateUserInput,
  UpdateUserInput,
  TwoFASetupResponse
} from './types';

/**
 * Získa zoznam používateľov
 */
export async function listUsers(role?: string): Promise<UserListItem[]> {
  const where = role ? { role } : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      companyName: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true
    }
  });

  return users.map(u => ({
    id: u.id,
    email: u.email,
    companyName: u.companyName,
    role: u.role,
    twoFactorEnabled: u.twoFactorEnabled,
    createdAt: u.createdAt.toISOString()
  }));
}

/**
 * Získa používateľa podľa ID
 */
export async function getUser(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      companyName: true,
      ico: true,
      dic: true,
      vatId: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true
    }
  });

  if (!user) return null;

  return {
    ...user,
    createdAt: user.createdAt.toISOString()
  };
}

/**
 * Vytvorí nového používateľa
 */
export async function createUser(input: CreateUserInput): Promise<UserListItem> {
  // Kontrola či email už existuje
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() }
  });

  if (existing) {
    throw new Error('Používateľ s týmto emailom už existuje');
  }

  // Hash hesla
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      companyName: input.companyName,
      ico: input.ico || null,
      dic: input.dic || null,
      vatId: input.vatId || null,
      role: input.role || 'user',
      twoFactorEnabled: input.twoFactorEnabled || false
    },
    select: {
      id: true,
      email: true,
      companyName: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true
    }
  });

  return {
    id: user.id,
    email: user.email,
    companyName: user.companyName,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt.toISOString()
  };
}

/**
 * Aktualizuje používateľa
 */
export async function updateUser(id: number, input: UpdateUserInput): Promise<UserListItem> {
  // Skontroluj či používateľ existuje
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Používateľ nenájdený');
  }

  // Ak sa mení email, skontroluj unikátnosť
  if (input.email && input.email.toLowerCase() !== existing.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });
    if (emailExists) {
      throw new Error('Používateľ s týmto emailom už existuje');
    }
  }

  // Priprav dáta na update
  const updateData: Record<string, unknown> = {};

  if (input.email) updateData.email = input.email.toLowerCase();
  if (input.companyName) updateData.companyName = input.companyName;
  if (input.ico !== undefined) updateData.ico = input.ico || null;
  if (input.dic !== undefined) updateData.dic = input.dic || null;
  if (input.vatId !== undefined) updateData.vatId = input.vatId || null;
  if (input.role) updateData.role = input.role;
  if (typeof input.twoFactorEnabled === 'boolean') updateData.twoFactorEnabled = input.twoFactorEnabled;

  // Ak sa mení heslo, zahashuj ho
  if (input.password) {
    updateData.passwordHash = await bcrypt.hash(input.password, 12);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      companyName: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true
    }
  });

  return {
    id: user.id,
    email: user.email,
    companyName: user.companyName,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt.toISOString()
  };
}

/**
 * Zmaže používateľa
 */
export async function deleteUser(id: number): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Používateľ nenájdený');
  }

  await prisma.user.delete({ where: { id } });
}

/**
 * Generuje 2FA secret pre používateľa
 */
export async function generate2FASecret(id: number): Promise<TwoFASetupResponse> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, companyName: true, twoFactorEnabled: true }
  });

  if (!user) {
    throw new Error('Používateľ nenájdený');
  }

  const secret = authenticator.generateSecret();
  const issuer = 'Eshop Admin';
  const accountName = user.companyName || user.email;
  const otpauthUrl = authenticator.keyuri(accountName, issuer, secret);

  return {
    secret,
    otpauthUrl,
    twoFactorEnabled: user.twoFactorEnabled
  };
}

/**
 * Aktivuje 2FA pre používateľa
 */
export async function enable2FA(id: number, secret: string, code: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('Používateľ nenájdený');
  }

  // Overiť kód
  const isValid = authenticator.check(code, secret);
  if (!isValid) {
    throw new Error('Neplatný overovací kód');
  }

  await prisma.user.update({
    where: { id },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: secret
    }
  });
}

/**
 * Deaktivuje 2FA pre používateľa
 */
export async function disable2FA(id: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('Používateľ nenájdený');
  }

  await prisma.user.update({
    where: { id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null
    }
  });
}
