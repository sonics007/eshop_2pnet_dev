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
  TwoFASetupResponse,
  AdminInviteResult,
  SetPasswordInput
} from './types';
import { randomBytes } from 'crypto';

function safeParsePayment(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
      paymentMethods: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true
    }
  });

  return users.map(u => ({
    id: u.id,
    email: u.email,
    companyName: u.companyName,
    paymentMethods: u.paymentMethods ? safeParsePayment(u.paymentMethods) : [],
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
      paymentMethods: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true
    }
  });

  if (!user) return null;

  return {
    ...user,
    paymentMethods: user.paymentMethods ? safeParsePayment(user.paymentMethods) : [],
    createdAt: user.createdAt.toISOString()
  };
}

/**
 * Vytvorí nového používateľa
 */
export async function createUser(input: CreateUserInput): Promise<UserListItem> {
  console.log('[Service] createUser called with:', { ...input, password: input.password ? '***' : undefined });

  // Kontrola či email už existuje
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() }
  });
  console.log('[Service] Existing user check:', existing ? 'FOUND' : 'NOT FOUND');

  if (existing) {
    throw new Error('Používateľ s týmto emailom už existuje');
  }

  // Pre bežných používateľov je heslo povinné
  console.log('[Service] sendInvitation:', input.sendInvitation, 'password:', !!input.password);
  if (!input.sendInvitation && !input.password) {
    throw new Error('Heslo je povinné');
  }

  // Hash hesla alebo null pre invitation
  const passwordHash = input.password
    ? await bcrypt.hash(input.password, 12)
    : null;

  // Generuj invitation token ak je to admin bez hesla
  let invitationToken: string | null = null;
  let invitationExpiry: Date | null = null;

  if (input.sendInvitation && !input.password) {
    invitationToken = randomBytes(32).toString('hex');
    invitationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hodín
  }

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      companyName: input.companyName,
      ico: input.ico || null,
      dic: input.dic || null,
      vatId: input.vatId || null,
      paymentMethods: input.paymentMethods ? JSON.stringify(input.paymentMethods) : '[]',
      role: input.role || 'user',
      twoFactorEnabled: input.twoFactorEnabled || false,
      invitationToken,
      invitationExpiry
    },
    select: {
      id: true,
      email: true,
      companyName: true,
      paymentMethods: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true,
      invitationToken: true
    }
  });

  return {
    id: user.id,
    email: user.email,
    companyName: user.companyName,
    paymentMethods: user.paymentMethods ? safeParsePayment(user.paymentMethods) : [],
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt.toISOString()
  };
}

/**
 * Vytvorí admina a pošle invitation email
 */
export async function createAdminWithInvitation(input: CreateUserInput): Promise<AdminInviteResult> {
  console.log('[Service] createAdminWithInvitation called with:', input);

  // Vytvor admina bez hesla
  const user = await createUser({
    ...input,
    role: 'admin',
    sendInvitation: true,
    password: undefined
  });
  console.log('[Service] User created:', user);

  // Získaj invitation token
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { invitationToken: true }
  });

  let invitationSent = false;
  let invitationError: string | undefined;

  // Pošli invitation email
  if (dbUser?.invitationToken) {
    try {
      const { sendAdminInvitationEmail } = await import('@/lib/modules/email/service');
      const result = await sendAdminInvitationEmail(user.email, dbUser.invitationToken, user.companyName);
      invitationSent = result.success;
      if (!result.success) {
        invitationError = result.error;
      }
    } catch (error) {
      invitationError = error instanceof Error ? error.message : 'Nepodarilo sa odoslať email';
    }
  }

  return {
    user,
    invitationSent,
    invitationError
  };
}

/**
 * Nastaví heslo cez invitation token
 */
export async function setPasswordByToken(input: SetPasswordInput): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findFirst({
    where: { invitationToken: input.token }
  });

  if (!user) {
    return { success: false, error: 'Neplatný alebo expirovaný odkaz' };
  }

  const expiry = user.invitationExpiry ? new Date(user.invitationExpiry as any) : null;
  if (!expiry || expiry.getTime() < Date.now()) {
    return { success: false, error: 'Neplatný alebo expirovaný odkaz' };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      invitationToken: null,
      invitationExpiry: null
    }
  });

  return { success: true };
}

/**
 * Znovu pošle invitation email
 */
export async function resendInvitation(userId: number): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, companyName: true, passwordHash: true, role: true }
  });

  if (!user) {
    return { success: false, error: 'Používateľ nenájdený' };
  }

  if (user.passwordHash) {
    return { success: false, error: 'Používateľ už má nastavené heslo' };
  }

  // Generuj nový token
  const invitationToken = randomBytes(32).toString('hex');
  const invitationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: { invitationToken, invitationExpiry }
  });

  // Pošli email
  try {
    const { sendAdminInvitationEmail } = await import('@/lib/modules/email/service');
    const result = await sendAdminInvitationEmail(user.email, invitationToken, user.companyName);
    return { success: result.success, error: result.error };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Chyba pri odosielaní' };
  }
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
    if (input.paymentMethods !== undefined) updateData.paymentMethods = input.paymentMethods ? JSON.stringify(input.paymentMethods) : '[]';
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
      paymentMethods: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true
    }
  });

  return {
    id: user.id,
    email: user.email,
    companyName: user.companyName,
    paymentMethods: user.paymentMethods ? safeParsePayment(user.paymentMethods) : [],
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

  // odstráň/odpojí závislosti, aby FK neblokovali zmazanie
  await prisma.order.updateMany({
    where: { userId: id },
    data: { userId: null }
  });

  await prisma.invoice.updateMany({
    where: { userId: id },
    data: { userId: null }
  });

  // vymaž reset a invitation tokeny patriace tomuto používateľovi (podľa value.userId)
  await prisma.config.deleteMany({
    where: {
      AND: [
        { key: { startsWith: 'reset-token-' } },
        { value: { contains: `"userId":${id}` } }
      ]
    }
  }).catch(() => null);

  await prisma.config.deleteMany({
    where: {
      AND: [
        { key: { startsWith: 'invitation-token-' } },
        { value: { contains: `"userId":${id}` } }
      ]
    }
  }).catch(() => null);

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
