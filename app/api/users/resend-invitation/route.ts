import { NextResponse } from 'next/server';
import { resendInvitation } from '@/lib/modules/users/service';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';

interface ResendInvitationResponse {
  success: boolean;
  error?: string;
}

/**
 * POST /api/users/resend-invitation
 * Znovu poslať invitation email pre admina
 */
export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return unauthorizedResponse('Prístup len pre administrátorov');
  }

  try {
    const body = await request.json();

    if (!body.userId) {
      return NextResponse.json<ResendInvitationResponse>({
        success: false,
        error: 'userId je povinné'
      }, { status: 400 });
    }

    const result = await resendInvitation(Number(body.userId));

    if (!result.success) {
      return NextResponse.json<ResendInvitationResponse>({
        success: false,
        error: result.error
      }, { status: 400 });
    }

    return NextResponse.json<ResendInvitationResponse>({
      success: true
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    return NextResponse.json<ResendInvitationResponse>({
      success: false,
      error: 'Chyba servera'
    }, { status: 500 });
  }
}
