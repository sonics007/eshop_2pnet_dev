import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sampleInvoices, sampleOrders } from '@/lib/sampleData';
import type { InvoiceRecord } from '@/types/orders';
import { withCustomerAuth } from '@/lib/auth/middleware';

export async function GET() {
  return withCustomerAuth(async (user) => {
    const email = user?.email?.toLowerCase();

    try {
      if (!email) {
        return NextResponse.json({ success: true, data: [] });
      }

      // Find orders for this email to get DB IDs
      const orders = await prisma.order.findMany({
        where: { email: email },
        select: { id: true, externalId: true }
      });
      const orderIds = orders.map((o) => o.id);

      const invoices = await prisma.invoice.findMany({
        where: orderIds.length ? { orderId: { in: orderIds } } : undefined,
        orderBy: { issueDate: 'desc' }
      });

      const payload: InvoiceRecord[] = invoices.map((inv) => ({
        id: `INV-${inv.invoiceNumber}`,
        invoiceNumber: inv.invoiceNumber,
        variableSymbol: inv.variableSymbol ?? '',
        customer: inv.customerName,
        issueDate: inv.issueDate.toISOString().slice(0, 10),
        dueDate: inv.dueDate.toISOString().slice(0, 10),
        total: inv.totalPrice,
        currency: inv.currency,
        orderId: inv.orderId ? orders.find((o) => o.id === inv.orderId)?.externalId : undefined,
        templateVersion: inv.templateVersion ?? 'default'
      }));

      return NextResponse.json({ success: true, data: payload });
    } catch (error) {
      console.warn('Invoices customer API fallback:', error);
      const filteredOrders = email
        ? sampleOrders.filter((o) => o.email.toLowerCase() === email).map((o) => o.id)
        : sampleOrders.map((o) => o.id);
      const filteredInvoices = sampleInvoices.filter((inv) => inv.orderId && filteredOrders.includes(inv.orderId));
      return NextResponse.json({ success: true, data: filteredInvoices });
    }
  });
}
