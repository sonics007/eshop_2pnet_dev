import { NextResponse } from 'next/server';
import { listUsers, createUser, createAdminWithInvitation } from '@/lib/modules/users/service';
import type { UsersListResponse, UserResponse, AdminInviteResult } from '@/lib/modules/users';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';

/**
 * GET /api/users
 * Zoznam všetkých používateľov - vyžaduje admin autentifikáciu
 */
export async function GET(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return unauthorizedResponse('Prístup len pre administrátorov');
  }

  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || undefined;

    const users = await listUsers(role);

    return NextResponse.json<UsersListResponse>({
      success: true,
      users
    });
  } catch (error) {
    console.error('Users list error:', error);
    return NextResponse.json<UsersListResponse>({
      success: false,
      error: 'Chyba servera'
    }, { status: 500 });
  }
}

interface AdminInviteResponse {
  success: boolean;
  user?: AdminInviteResult['user'];
  invitationSent?: boolean;
  invitationError?: string;
  error?: string;
}

/**
 * POST /api/users
 * Vytvorenie nového používateľa - vyžaduje admin autentifikáciu
 */
export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return unauthorizedResponse('Prístup len pre administrátorov');
  }

  try {
    const body = await request.json();

    // Pre adminov bez hesla použijeme invitation flow
    const isAdminWithoutPassword = body.role === 'admin' && !body.password;

    if (isAdminWithoutPassword) {
      // Validácia pre admin invitation
      if (!body.email) {
        return NextResponse.json<AdminInviteResponse>({
          success: false,
          error: 'Email je povinný'
        }, { status: 400 });
      }

      try {
        console.log('[API] Creating admin with invitation:', { email: body.email, companyName: body.companyName });
        const result = await createAdminWithInvitation({
          email: body.email,
          companyName: body.companyName || body.email.split('@')[0],
          role: 'admin'
        });
        console.log('[API] Admin created successfully:', result);

        return NextResponse.json<AdminInviteResponse>({
          success: true,
          user: result.user,
          invitationSent: result.invitationSent,
          invitationError: result.invitationError
        });
      } catch (adminError) {
        const msg = adminError instanceof Error ? adminError.message : 'Chyba pri vytváraní administrátora';
        console.error('[API] Admin invitation error:', adminError);
        return NextResponse.json<AdminInviteResponse>({
          success: false,
          error: msg
        }, { status: 400 });
      }
    }

    // Štandardné vytváranie používateľa
    if (!body.email || !body.password || !body.companyName) {
      return NextResponse.json<UserResponse>({
        success: false,
        error: 'Email, heslo a meno sú povinné'
      }, { status: 400 });
    }

    const user = await createUser(body);

    return NextResponse.json<UserResponse>({
      success: true,
      user
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chyba servera';
    console.error('Create user error:', error);
    return NextResponse.json<UserResponse>({
      success: false,
      error: message
    }, { status: 400 });
  }
}
