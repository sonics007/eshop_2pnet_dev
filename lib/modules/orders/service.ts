/**
 * ORDERS MODULE - Service Layer
 *
 * Biznis logika pre objednávky.
 * Server-only - nepoužívať na klientovi.
 */

import { prisma } from '@/lib/prisma';
import type {
  Order,
  OrderItem,
  OrderHistory,
  OrderStatus,
  OrderFilter,
  OrderListResult,
  CreateOrderData
} from './types';

// ===============================
// HELPERS
// ===============================

function generateExternalId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${year}${month}-${random}`;
}

function mapOrder(o: {
  id: number;
  externalId: string;
  customerName: string;
  email: string;
  status: string;
  total: number;
  paymentMethod: string | null;
  userId: number | null;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: number;
    orderId: number;
    productId: number | null;
    name: string;
    quantity: number;
    price: number;
  }[];
  history: {
    id: number;
    orderId: number;
    status: string;
    note: string | null;
    timestamp: Date;
  }[];
}): Order {
  return {
    id: o.id,
    externalId: o.externalId,
    customerName: o.customerName,
    customerEmail: o.email,
    status: o.status as OrderStatus,
    total: o.total,
    paymentMethod: o.paymentMethod || undefined,
    userId: o.userId || undefined,
    items: o.items.map(i => ({
      id: i.id,
      orderId: i.orderId,
      productId: i.productId || undefined,
      name: i.name,
      quantity: i.quantity,
      price: i.price
    })),
    history: o.history.map(h => ({
      id: h.id,
      orderId: h.orderId,
      status: h.status as OrderStatus,
      note: h.note || undefined,
      timestamp: h.timestamp
    })),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt
  };
}

// ===============================
// ORDERS
// ===============================

export async function getOrders(
  filter: OrderFilter = {},
  page = 1,
  pageSize = 20
): Promise<OrderListResult> {
  const where: Record<string, unknown> = {};

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.userId) {
    where.userId = filter.userId;
  }

  if (filter.dateFrom || filter.dateTo) {
    where.createdAt = {};
    if (filter.dateFrom) {
      (where.createdAt as Record<string, Date>).gte = filter.dateFrom;
    }
    if (filter.dateTo) {
      (where.createdAt as Record<string, Date>).lte = filter.dateTo;
    }
  }

  if (filter.search) {
    where.OR = [
      { customerName: { contains: filter.search } },
      { email: { contains: filter.search } },
      { externalId: { contains: filter.search } }
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        history: { orderBy: { timestamp: 'desc' } }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.order.count({ where })
  ]);

  return {
    orders: orders.map(mapOrder),
    total,
    page,
    pageSize
  };
}

export async function getOrderById(id: number): Promise<Order | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      history: { orderBy: { timestamp: 'desc' } }
    }
  });

  return order ? mapOrder(order) : null;
}

export async function getOrderByExternalId(externalId: string): Promise<Order | null> {
  const order = await prisma.order.findUnique({
    where: { externalId },
    include: {
      items: true,
      history: { orderBy: { timestamp: 'desc' } }
    }
  });

  return order ? mapOrder(order) : null;
}

export async function createOrder(data: CreateOrderData): Promise<Order> {
  const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      externalId: generateExternalId(),
      customerName: data.customerName,
      email: data.customerEmail,
      status: 'new',
      total,
      paymentMethod: data.paymentMethod || 'unspecified',
      userId: data.userId || null,
      items: {
        create: data.items.map(item => ({
          productId: item.productId || null,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      },
      history: {
        create: {
          status: 'new',
          note: 'Objednávka vytvorená'
        }
      }
    },
    include: {
      items: true,
      history: { orderBy: { timestamp: 'desc' } }
    }
  });

  return mapOrder(order);
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
  note?: string
): Promise<Order | null> {
  try {
    // Pridaj záznam do histórie
    await prisma.orderHistory.create({
      data: {
        orderId: id,
        status,
        note: note || null
      }
    });

    // Aktualizuj status objednávky
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        history: { orderBy: { timestamp: 'desc' } }
      }
    });

    return mapOrder(order);
  } catch {
    return null;
  }
}

export async function getOrdersByUser(userId: number): Promise<Order[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      history: { orderBy: { timestamp: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return orders.map(mapOrder);
}

// ===============================
// STATISTICS
// ===============================

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
}

export async function getOrderStats(): Promise<OrderStats> {
  const [totalOrders, totalRevenue, statusCounts] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true }
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ]);

  const ordersByStatus: Record<OrderStatus, number> = {
    new: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  };

  statusCounts.forEach(s => {
    ordersByStatus[s.status as OrderStatus] = s._count.status;
  });

  return {
    totalOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    ordersByStatus
  };
}
