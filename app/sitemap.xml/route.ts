/**
 * Public sitemap.xml route
 */

import { NextResponse } from 'next/server';
import { generateSitemapXml } from '@/lib/modules/seo';

export async function GET() {
  try {
    const xml = await generateSitemapXml();
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error generating sitemap.xml:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        headers: {
          'Content-Type': 'application/xml'
        }
      }
    );
  }
}
