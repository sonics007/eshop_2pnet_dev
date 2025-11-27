import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sampleInvoices, sampleOrders } from '@/lib/sampleData';
import { generateInvoiceFromOrder, persistInvoice } from '@/lib/invoice';
import { mapStatus } from '@/lib/orderStatus';
import type { AdminOrder, InvoiceRecord } from '@/types/orders';

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { issueDate: 'desc' },
      include: { order: true }
    });
    if (!invoices.length) {
      throw new Error('No invoices in DB');
    }
    const payload: InvoiceRecord[] = invoices.map((invoice) => ({
      id: `INV-${invoice.invoiceNumber}`,
      invoiceNumber: invoice.invoiceNumber,
      variableSymbol: invoice.variableSymbol,
      customer: invoice.customerName,
      issueDate: invoice.issueDate.toISOString().slice(0, 10),
      dueDate: invoice.dueDate.toISOString().slice(0, 10),
      total: invoice.totalPrice,
      currency: invoice.currency,
      orderId: invoice.order?.externalId
    }));
    return NextResponse.json({ data: payload });
  } catch (error) {
    console.warn('Falling back to sample invoices:', error);
    return NextResponse.json({ data: sampleInvoices });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderId: string | undefined = body.orderId;
    const fallbackOrder = body.order as AdminOrder | undefined;
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Chýba ID objednávky.' }, { status: 400 });
    }

    const order: AdminOrder | undefined =
      sampleOrders.find((sample) => sample.id === orderId) ??
      (await prisma.order
        .findUnique({ where: { externalId: orderId }, include: { items: true, history: true } })
        .then((dbOrder) =>
          dbOrder
            ? {
                id: dbOrder.externalId,
                customer: dbOrder.customerName,
                companyId: dbOrder.companyId ?? '',
                email: dbOrder.email,
                status: mapStatus(dbOrder.status),
                total: dbOrder.total,
                items: dbOrder.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price
                })),
                history: dbOrder.history.map((entry) => ({
                  status: mapStatus(entry.status),
                  timestamp: entry.timestamp.toISOString(),
                  note: entry.note ?? undefined
                })),
                paymentMethod: dbOrder.paymentMethod,
                invoiceNumber: dbOrder.invoiceNumber ?? '—',
                assignedTo: dbOrder.assignedTo ?? '—'
              }
            : undefined
        )) ??
      fallbackOrder;

    if (!order) {
      return NextResponse.json({ success: false, message: 'Objednávka sa nenašla.' }, { status: 404 });
    }

    const { invoice: invoiceData, template } = await generateInvoiceFromOrder(order, body.templateVersion ?? 'default');
    const invoiceRecord = await persistInvoice(invoiceData);

    return NextResponse.json({ success: true, invoice: invoiceRecord, template });
  } catch (error) {
    console.error('Invoice generation failed:', error);
    return NextResponse.json(
      { success: false, message: 'Generovanie faktúry zlyhalo. Skontrolujte serverové logy.' },
      { status: 500 }
    );
  }
}

