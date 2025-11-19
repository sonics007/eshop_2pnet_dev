import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sampleInvoices, sampleOrders } from '@/lib/sampleData';
import { sendInvoiceToFlexibee, type FlexibeeInvoicePayload, isFlexibeeConfigured } from '@/lib/flexibee';

type OrderWithItems = {
  items: Array<{ name: string; quantity: number; price: number }>;
  customerName: string;
  customerIco?: string;
  customerDic?: string;
  customerEmail?: string;
};

const formatDate = (value: Date | string) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value;

async function loadInvoiceData(invoiceNumber: string): Promise<FlexibeeInvoicePayload | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: { order: { include: { items: true } } }
  });

  if (invoice) {
    const base: OrderWithItems = {
      items:
        invoice.order?.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })) ?? [],
      customerName: invoice.customerName,
      customerIco: invoice.customerIco ?? undefined,
      customerDic: invoice.customerDic ?? undefined,
      customerEmail: invoice.order?.email ?? undefined
    };

    return {
      invoiceNumber: invoice.invoiceNumber,
      variableSymbol: invoice.variableSymbol,
      issueDate: formatDate(invoice.issueDate),
      dueDate: formatDate(invoice.dueDate),
      currency: invoice.currency,
      totalPrice: invoice.totalPrice,
      ...base
    };
  }

  const sampleInvoice = sampleInvoices.find((item) => item.invoiceNumber === invoiceNumber);
  if (sampleInvoice) {
    const sampleOrder = sampleOrders.find((item) => item.id === sampleInvoice.orderId);
    return {
      invoiceNumber: sampleInvoice.invoiceNumber,
      variableSymbol: sampleInvoice.variableSymbol,
      issueDate: sampleInvoice.issueDate,
      dueDate: sampleInvoice.dueDate,
      currency: sampleInvoice.currency,
      totalPrice: sampleInvoice.total,
      customerName: sampleInvoice.customer,
      customerIco: sampleOrder?.companyId,
      customerDic: sampleOrder?.companyId,
      customerEmail: sampleOrder?.email,
      items:
        sampleOrder?.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })) ?? []
    };
  }

  return null;
}

export async function POST(request: Request) {
  try {
    if (!(await isFlexibeeConfigured())) {
      return NextResponse.json(
        {
          success: false,
          message: 'FlexiBee prístup nie je nastavený (.env). Nakonfigurujte integráciu v admin nastaveniach.'
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const invoiceNumber: string | undefined = body.invoiceNumber;
    if (!invoiceNumber) {
      return NextResponse.json({ success: false, message: 'Chýba číslo faktúry.' }, { status: 400 });
    }

    let payload: FlexibeeInvoicePayload | null = null;
    try {
      payload = await loadInvoiceData(invoiceNumber);
    } catch (error) {
      console.error('Unable to load invoice from DB, using fallback', error);
      payload = await loadInvoiceData(invoiceNumber);
    }

    if (!payload) {
      return NextResponse.json({ success: false, message: 'Faktúra neexistuje.' }, { status: 404 });
    }

    await sendInvoiceToFlexibee(payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('FlexiBee sync failed:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Odoslanie nebolo úspešné.' },
      { status: 500 }
    );
  }
}
