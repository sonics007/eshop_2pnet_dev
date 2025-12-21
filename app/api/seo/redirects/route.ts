/**
 * SEO Redirects API
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllRedirects,
  createRedirect,
  updateRedirect,
  deleteRedirect
} from '@/lib/modules/seo';

export async function GET() {
  try {
    const redirects = await getAllRedirects();
    return NextResponse.json({ success: true, data: redirects });
  } catch (error) {
    console.error('Error reading redirects:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa načítať presmerovania' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.fromPath || !body.toPath) {
      return NextResponse.json(
        { success: false, error: 'Cesta z a cesta na sú povinné' },
        { status: 400 }
      );
    }

    const redirect = await createRedirect({
      fromPath: body.fromPath,
      toPath: body.toPath,
      statusCode: body.statusCode || 301,
      enabled: body.enabled ?? true
    });

    return NextResponse.json({ success: true, data: redirect });
  } catch (error) {
    console.error('Error creating redirect:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa vytvoriť presmerovanie' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID je povinné' },
        { status: 400 }
      );
    }

    const redirect = await updateRedirect(body.id, {
      fromPath: body.fromPath,
      toPath: body.toPath,
      statusCode: body.statusCode,
      enabled: body.enabled
    });

    return NextResponse.json({ success: true, data: redirect });
  } catch (error) {
    console.error('Error updating redirect:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa aktualizovať presmerovanie' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID je povinné' },
        { status: 400 }
      );
    }

    await deleteRedirect(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting redirect:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa odstrániť presmerovanie' },
      { status: 500 }
    );
  }
}
