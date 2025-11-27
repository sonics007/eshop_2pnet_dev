import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reverseStatus } from '@/lib/orderStatus';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  try {
    const order = await prisma.order.update({
      where: { externalId: id },
      data: {
        status: reverseStatus(body.status),
        history: {
          create: {
            status: reverseStatus(body.status),
            note: body.note,
            timestamp: new Date()
          }
        }
      },
      include: { history: true }
    });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Status update failed', error);
    return NextResponse.json(
      { success: false, message: 'Nepodarilo sa aktualizovať stav, DB può byť nedostupná.' },
      { status: 500 }
    );
  }
}
