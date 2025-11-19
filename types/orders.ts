export type OrderStatus = 'Prijatá' | 'Spracovanie' | 'Expedovaná' | 'Dokončená' | 'Stornovaná';

export type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

export type OrderHistoryEntry = {
  status: OrderStatus;
  timestamp: string;
  note?: string;
};

export type AdminOrder = {
  id: string;
  customer: string;
  companyId: string;
  email: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  history: OrderHistoryEntry[];
  paymentMethod: string;
  invoiceNumber: string;
  assignedTo: string;
};

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  variableSymbol: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  total: number;
  currency: string;
  orderId?: string;
  templateVersion?: string;
};
