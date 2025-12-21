import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isAdminAuthenticated, unauthorizedResponse } from '@/lib/auth/middleware';

export async function POST(request: Request) {
  const admin = await isAdminAuthenticated();
  if (!admin) return unauthorizedResponse('Len pre adminov');

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'Chýba súbor' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ success: false, error: 'Povolené sú len PDF' }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'newsletters');
  await fs.mkdir(uploadsDir, { recursive: true });

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\\-_]/g, '') || 'newsletter'}.pdf`;
  const destPath = path.join(uploadsDir, fileName);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(destPath, buffer);

  // Pokús sa vytiahnuť text z PDF a urobiť z neho jednoduché HTML
  let extractedHtml: string | undefined;
  try {
    const mod = await import('pdf-parse');
    const pdfParse = (mod as any).default || (mod as any);
    if (typeof pdfParse === 'function') {
      const parsed = await pdfParse(buffer);
      if (parsed?.text) {
        const paragraphs = parsed.text
          .split(/\\n\\s*\\n/)
          .map((p: string) => p.trim())
          .filter(Boolean)
          .map((p: string) => `<p>${p.replace(/\\n+/g, '<br/>')}</p>`)
          .join('\\n');
        if (paragraphs) {
          extractedHtml = `<div><embed src="/uploads/newsletters/${fileName}" type="application/pdf" width="100%" height="900px" style="border-radius:16px; border:1px solid #e2e8f0;"/></div><div style="margin-top:12px">${paragraphs}</div>`;
        }
      }
    }
  } catch (error) {
    console.error('PDF parse failed', error);
  }
  // fallback ak sa nepodarí extrahovať text
  if (!extractedHtml) {
    extractedHtml = `<div><embed src="/uploads/newsletters/${fileName}" type="application/pdf" width="100%" height="900px" style="border-radius:16px; border:1px solid #e2e8f0;"/></div>`;
  }
  const publicUrl = `/uploads/newsletters/${fileName}`;
  return NextResponse.json({ success: true, url: publicUrl, html: extractedHtml });
}
