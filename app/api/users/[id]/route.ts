import { NextResponse } from 'next/server';
import { getUser, updateUser, deleteUser } from '@/lib/modules/users/service';
import type { UserResponse } from '@/lib/modules/users';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]
 * Detail používateľa
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json<UserResponse>({
        success: false,
        error: 'Neplatné ID'
      }, { status: 400 });
    }

    const user = await getUser(userId);

    if (!user) {
      return NextResponse.json<UserResponse>({
        success: false,
        error: 'Používateľ nenájdený'
      }, { status: 404 });
    }

    return NextResponse.json<UserResponse>({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json<UserResponse>({
      success: false,
      error: 'Chyba servera'
    }, { status: 500 });
  }
}

/**
 * PUT /api/users/[id]
 * Úprava používateľa
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json<UserResponse>({
        success: false,
        error: 'Neplatné ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const user = await updateUser(userId, body);

    return NextResponse.json<UserResponse>({
      success: true,
      user
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chyba servera';
    console.error('Update user error:', error);
    return NextResponse.json<UserResponse>({
      success: false,
      error: message
    }, { status: 400 });
  }
}

/**
 * DELETE /api/users/[id]
 * Zmazanie používateľa
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: 'Neplatné ID' }, { status: 400 });
    }

    await deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chyba servera';
    console.error('Delete user error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
