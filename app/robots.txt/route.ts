/**
 * Public robots.txt route
 */

import { NextResponse } from 'next/server';
import { generateRobotsTxt } from '@/lib/modules/seo';

export async function GET() {
  try {
    const content = await generateRobotsTxt();
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    return new NextResponse('User-agent: *\nAllow: /', {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
}
