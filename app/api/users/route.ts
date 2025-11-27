import { NextResponse } from 'next/server';
import { listUsers, createUser } from '@/lib/modules/users/service';
import type { UsersListResponse, UserResponse } from '@/lib/modules/users';

/**
 * GET /api/users
 * Zoznam všetkých používateľov
 */
export async function GET(request: Request) {
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

/**
 * POST /api/users
 * Vytvorenie nového používateľa
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

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
