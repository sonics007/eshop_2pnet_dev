import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sampleOrders } from '@/lib/sampleData';
import { mapStatus, reverseStatus } from '@/lib/orderStatus';
import type { AdminOrder } from '@/types/orders';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        history: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!orders.length) {
      throw new Error('No orders seeded yet');
    }

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

    return NextResponse.json({ data: payload });
  } catch (error) {
    console.warn('Falling back to sample orders:', error);
    return NextResponse.json({ data: sampleOrders });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const order = await prisma.order.create({
      data: {
        externalId: body.id,
        customerName: body.customer,
        companyId: body.companyId,
        email: body.email,
        status: reverseStatus(body.status),
        total: body.total,
        paymentMethod: body.paymentMethod ?? 'Faktúra 14 dní',
        invoiceNumber: body.invoiceNumber,
        assignedTo: body.assignedTo,
        items: {
          create: body.items?.map((item: any) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        },
        history: {
          create: body.history?.map((item: any) => ({
            status: reverseStatus(item.status),
            note: item.note,
            timestamp: item.timestamp ? new Date(item.timestamp) : new Date()
          }))
        }
      }
    });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Unable to store order, returning fallback response', error);
    return NextResponse.json({ success: false, message: 'DB nedostupné, objednávka uložená len lokálne.' });
  }
}
