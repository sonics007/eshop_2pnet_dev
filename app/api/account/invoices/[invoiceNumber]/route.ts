import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sampleInvoices } from '@/lib/sampleData';
import { withCustomerAuth } from '@/lib/auth/middleware';

export async function GET(
  _request: Request,
  { params }: { params: { invoiceNumber: string } }
) {
  return withCustomerAuth(async (user) => {
    const invoiceNumber = params.invoiceNumber;
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { invoiceNumber },
        include: { order: true }
      });
      if (!invoice) {
        throw new Error('not found');
      }
      // Optional access control: ensure email matches (if stored)
      if (invoice.order?.email && invoice.order.email.toLowerCase() !== user?.email?.toLowerCase()) {
        return NextResponse.json({ success: false, error: 'Nemáte prístup k tejto faktúre.' }, { status: 403 });
      }
      return NextResponse.json({ success: true, data: invoice });
    } catch (error) {
      const fallback = sampleInvoices.find((inv) => inv.invoiceNumber === invoiceNumber);
      if (fallback) {
        return NextResponse.json({ success: true, data: fallback });
      }
      return NextResponse.json({ success: false, error: 'Faktúra sa nenašla.' }, { status: 404 });
    }
  });
}
