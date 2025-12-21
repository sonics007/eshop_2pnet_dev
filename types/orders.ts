// Interné anglické kódy pre status - používané v API a logike
export type OrderStatus = 'new' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Slovenské preklady pre zobrazenie v UI
export const orderStatusLabels: Record<OrderStatus, string> = {
  new: 'Prijatá',
  confirmed: 'Potvrdená',
  processing: 'Spracovanie',
  shipped: 'Expedovaná',
  delivered: 'Dokončená',
  cancelled: 'Stornovaná'
};

// Mapovanie z DB kódov na interné kódy
export const dbToStatus: Record<string, OrderStatus> = {
  'PRIJATA': 'new',
  'POTVRDENA': 'confirmed',
  'SPRACOVANIE': 'processing',
  'EXPEDOVANA': 'shipped',
  'DOKONCENA': 'delivered',
  'STORNOVANA': 'cancelled'
};

// Mapovanie z interných kódov na DB kódy
export const statusToDb: Record<OrderStatus, string> = {
  new: 'PRIJATA',
  confirmed: 'POTVRDENA',
  processing: 'SPRACOVANIE',
  shipped: 'EXPEDOVANA',
  delivered: 'DOKONCENA',
  cancelled: 'STORNOVANA'
};

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
