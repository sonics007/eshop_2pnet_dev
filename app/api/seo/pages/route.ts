/**
 * SEO Pages API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllSeoPages, upsertSeoPage, deleteSeoPage, getSeoPage } from '@/lib/modules/seo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (path) {
      const page = await getSeoPage(path);
      if (!page) {
        return NextResponse.json(
          { success: false, error: 'Stránka nenájdená' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: page });
    }

    const pages = await getAllSeoPages();
    return NextResponse.json({ success: true, data: pages });
  } catch (error) {
    console.error('Error reading SEO pages:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa načítať SEO stránky' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.path) {
      return NextResponse.json(
        { success: false, error: 'Cesta je povinná' },
        { status: 400 }
      );
    }

    const page = await upsertSeoPage(body);
    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    console.error('Error saving SEO page:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa uložiť SEO stránku' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { success: false, error: 'Cesta je povinná' },
        { status: 400 }
      );
    }

    await deleteSeoPage(path);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting SEO page:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa odstrániť SEO stránku' },
      { status: 500 }
    );
  }
}
