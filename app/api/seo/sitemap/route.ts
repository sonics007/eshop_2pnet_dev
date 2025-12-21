/**
 * SEO Sitemap API
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSitemapXml, generateSitemapUrls } from '@/lib/modules/seo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    // Return XML sitemap
    if (format === 'xml') {
      const xml = await generateSitemapXml();
      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
    }

    // Return JSON URLs list (for preview)
    const urls = await generateSitemapUrls();
    return NextResponse.json({ success: true, data: urls });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return NextResponse.json(
      { success: false, error: 'Nepodarilo sa vygenerovať sitemap' },
      { status: 500 }
    );
  }
}
