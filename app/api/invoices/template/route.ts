import { NextResponse } from 'next/server';
import { readInvoiceTemplate, writeInvoiceTemplate, type InvoiceTemplate } from '@/lib/invoiceTemplate';

export async function GET() {
  const template = await readInvoiceTemplate();
  return NextResponse.json(template);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as InvoiceTemplate;
  if (!payload?.supplier?.name || !payload?.supplier?.ico) {
    return NextResponse.json({ success: false, message: 'Vyplňte povinné údaje dodavatele.' }, { status: 400 });
  }
  await writeInvoiceTemplate(payload);
  return NextResponse.json({ success: true, template: payload });
}
