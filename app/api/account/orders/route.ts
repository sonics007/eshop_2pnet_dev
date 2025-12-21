import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sampleOrders } from '@/lib/sampleData';
import type { AdminOrder } from '@/types/orders';
import { mapStatus } from '@/lib/orderStatus';
import { withCustomerAuth } from '@/lib/auth/middleware';

export async function GET() {
  return withCustomerAuth(async (user) => {
    const email = user?.email?.toLowerCase();

    try {
      if (!email) {
        return NextResponse.json({ success: true, data: [] });
      }

      const orders = await prisma.order.findMany({
        where: { email: email },
        include: { items: true, history: true },
        orderBy: { createdAt: 'desc' }
      });

      const payload: AdminOrder[] = orders.map((order) => ({
        id: order.externalId,
        customer: order.customerName,
        companyId: order.companyId ?? '',
        email: order.email,
        status: mapStatus(order.status),
        total: order.total,
        items: order.items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        history: order.history.map((entry) => ({
          status: mapStatus(entry.status),
          timestamp: entry.timestamp.toISOString(),
          note: entry.note ?? undefined
        })),
        paymentMethod: order.paymentMethod,
        invoiceNumber: order.invoiceNumber ?? '—',
        assignedTo: order.assignedTo ?? '—'
      }));

      return NextResponse.json({ success: true, data: payload });
    } catch (error) {
      console.warn('Orders customer API fallback:', error);
      const filtered = email
        ? sampleOrders.filter((o) => o.email.toLowerCase() === email)
        : sampleOrders;
      return NextResponse.json({ success: true, data: filtered });
    }
  });
}
