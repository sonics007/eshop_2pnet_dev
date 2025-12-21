/**
 * Auth Middleware Helpers
 *
 * Helper funkcie pre ochranu API routes.
 */

import { NextResponse } from 'next/server';
import { verifyAdminAccess, verifyCustomerAccess, type TokenPayload } from './jwt';

export interface AuthenticatedRequest {
  user: TokenPayload;
}

/**
 * Wrapper pre admin-only API routes
 *
 * Použitie:
 * ```ts
 * export async function GET(request: Request) {
 *   return withAdminAuth(async (user) => {
 *     // user je overený admin
 *     return NextResponse.json({ data: 'secret' });
 *   });
 * }
 * ```
 */
export async function withAdminAuth(
  handler: (user: TokenPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await verifyAdminAccess();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Neautorizovaný prístup' },
      { status: 401 }
    );
  }

  return handler(user);
}

/**
 * Wrapper pre customer API routes
 */
export async function withCustomerAuth(
  handler: (user: TokenPayload) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await verifyCustomerAccess();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Neautorizovaný prístup' },
      { status: 401 }
    );
  }

  return handler(user);
}

/**
 * Wrapper pre routes kde je auth voliteľná (guest alebo logged in)
 */
export async function withOptionalAuth(
  handler: (user: TokenPayload | null) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await verifyCustomerAccess();
  return handler(user);
}

/**
 * Jednoduchá kontrola admin prístupu - vracia boolean
 * Pre routes kde chcete manuálne riadiť response
 */
export async function isAdminAuthenticated(): Promise<TokenPayload | null> {
  return verifyAdminAccess();
}

/**
 * Jednoduchá kontrola customer prístupu - vracia boolean
 */
export async function isCustomerAuthenticated(): Promise<TokenPayload | null> {
  return verifyCustomerAccess();
}

/**
 * Vytvorí unauthorized response
 */
export function unauthorizedResponse(message = 'Neautorizovaný prístup'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

/**
 * Vytvorí forbidden response
 */
export function forbiddenResponse(message = 'Prístup zamietnutý'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}
