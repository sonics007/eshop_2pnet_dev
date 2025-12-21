/**
 * SEO Robots.txt API
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAllRobotsRules,
  createRobotsRule,
  updateRobotsRule,
  deleteRobotsRule,
  generateRobotsTxt
} from '@/lib/modules/seo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    // Return raw robots.txt content
    if (format === 'txt') {
      const content = await generateRobotsTxt();
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }

    // Return rules list
    const rules = await getAllRobotsRules();
    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    console.error('Error reading robots rules:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa načítať robots pravidlá' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.userAgent || !body.directive || !body.path) {
      return NextResponse.json(
        { success: false, error: 'User-Agent, direktíva a cesta sú povinné' },
        { status: 400 }
      );
    }

    const rule = await createRobotsRule({
      userAgent: body.userAgent,
      directive: body.directive,
      path: body.path,
      enabled: body.enabled ?? true,
      order: body.order ?? 0
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    console.error('Error creating robots rule:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa vytvoriť robots pravidlo' },
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

    const rule = await updateRobotsRule(body.id, {
      userAgent: body.userAgent,
      directive: body.directive,
      path: body.path,
      enabled: body.enabled,
      order: body.order
    });

    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    console.error('Error updating robots rule:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa aktualizovať robots pravidlo' },
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

    await deleteRobotsRule(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting robots rule:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa odstrániť robots pravidlo' },
      { status: 500 }
    );
  }
}
