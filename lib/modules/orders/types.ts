/**
 * ORDERS MODULE - Types
 *
 * Typy pre objednávky a históriu
 */

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: number;
  orderId: number;
  productId?: number;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderHistory {
  id: number;
  orderId: number;
  status: OrderStatus;
  note?: string;
  timestamp: Date;
}

export interface Order {
  id: number;
  externalId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  status: OrderStatus;
  total: number;
  paymentMethod?: string;
  userId?: number;
  items: OrderItem[];
  history: OrderHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  paymentMethod?: string;
  userId?: number;
  items: {
    productId?: number;
    name: string;
    quantity: number;
    price: number;
  }[];
}

export interface OrderFilter {
  status?: OrderStatus;
  userId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface OrderListResult {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

// Slovenské preklady statusov
export const orderStatusLabels: Record<OrderStatus, string> = {
  new: 'Nová',
  confirmed: 'Potvrdená',
  processing: 'Spracováva sa',
  shipped: 'Odoslaná',
  delivered: 'Doručená',
  cancelled: 'Zrušená'
};
