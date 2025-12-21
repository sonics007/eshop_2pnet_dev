/**
 * JWT Authentication Utilities
 *
 * Bezpečná implementácia JWT tokenov pre admin a customer autentifikáciu.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

// Konfigurácia
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.CONFIG_CRYPTO_KEY || 'default-dev-secret-change-in-production'
);
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';
const COOKIE_NAME_ACCESS = 'eshop-access-token';
const COOKIE_NAME_REFRESH = 'eshop-refresh-token';

export interface TokenPayload extends JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'customer';
  type: 'access' | 'refresh';
}

/**
 * Vytvorí access token
 */
export async function createAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Vytvorí refresh token
 */
export async function createRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Overí a dekóduje token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Nastaví auth cookies
 */
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();

  // Access token - kratšia expirácia
  cookieStore.set(COOKIE_NAME_ACCESS, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // 'lax' je bezpečnejšie pre navigáciu
    maxAge: 60 * 60, // 1 hodina
    path: '/'
  });

  // Refresh token - dlhšia expirácia
  cookieStore.set(COOKIE_NAME_REFRESH, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // 'lax' je bezpečnejšie pre navigáciu
    maxAge: 60 * 60 * 24 * 7, // 7 dní
    path: '/'
  });
}

/**
 * Odstráni auth cookies (logout)
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME_ACCESS);
  cookieStore.delete(COOKIE_NAME_REFRESH);
}

/**
 * Získa access token z cookies
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME_ACCESS)?.value || null;
}

/**
 * Získa refresh token z cookies
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME_REFRESH)?.value || null;
}

/**
 * Overí admin prístup - pre použitie v API routes
 * Automaticky sa pokúsi o refresh ak je access token neplatný
 */
export async function verifyAdminAccess(): Promise<TokenPayload | null> {
  let token = await getAccessToken();

  // Ak nemáme access token, skús refresh
  if (!token) {
    const newToken = await refreshAccessToken();
    if (!newToken) return null;
    token = newToken;
  }

  let payload = await verifyToken(token);

  // Ak je token neplatný (expired), skús refresh
  if (!payload) {
    const newToken = await refreshAccessToken();
    if (!newToken) return null;
    payload = await verifyToken(newToken);
  }

  if (!payload || payload.role !== 'admin') return null;

  return payload;
}

/**
 * Overí customer prístup - pre použitie v API routes
 */
export async function verifyCustomerAccess(): Promise<TokenPayload | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return payload;
}

/**
 * Refresh access token pomocou refresh tokenu
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const payload = await verifyToken(refreshToken);
  if (!payload || payload.type !== 'refresh') return null;

  // Vytvor nový access token
  const newAccessToken = await createAccessToken({
    userId: payload.userId,
    email: payload.email,
    role: payload.role
  });

  // Ulož do cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME_ACCESS, newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/'
  });

  return newAccessToken;
}
