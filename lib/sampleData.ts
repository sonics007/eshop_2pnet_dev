import type { AdminOrder, InvoiceRecord } from '@/types/orders';

export const sampleOrders: AdminOrder[] = [
  {
    id: 'OBJ-2025-001',
    customer: 'Inova Systems s.r.o.',
    companyId: 'SK1234567890',
    email: 'it@inovasystems.eu',
    status: 'Spracovanie',
    total: 6890,
    items: [
      { name: '2PN FortiEdge X5', quantity: 1, price: 3490 },
      { name: '2PN SwitchWave S4', quantity: 1, price: 1890 },
      { name: 'Pulse Monitoring 24/7', quantity: 1, price: 1490 }
    ],
    history: [
      { status: 'Prijatá', timestamp: '2025-01-12 09:04', note: 'objednávka vytvorená v e-shope' },
      { status: 'Spracovanie', timestamp: '2025-01-12 11:22', note: 'rezervácia skladov, čaká na faktúru' }
    ],
    paymentMethod: 'Faktúra 14 dní',
    invoiceNumber: 'FA-2025-00021',
    assignedTo: 'NOC tím'
  },
  {
    id: 'OBJ-2025-002',
    customer: 'TechNordic a.s.',
    companyId: 'CZ87654321',
    email: 'purchase@technordic.cz',
    status: 'Expedovaná',
    total: 5590,
    items: [{ name: 'Nebula Edge Server', quantity: 1, price: 5590 }],
    history: [
      { status: 'Prijatá', timestamp: '2025-01-10 08:15' },
      { status: 'Spracovanie', timestamp: '2025-01-10 10:32', note: 'synchronizované s ERP' },
      { status: 'Expedovaná', timestamp: '2025-01-11 15:05', note: 'zásielka DPD #55231' }
    ],
    paymentMethod: 'Faktúra 30 dní',
    invoiceNumber: 'FA-2025-00022',
    assignedTo: 'Logistika'
  },
  {
    id: 'OBJ-2025-003',
    customer: 'RetailHub s.r.o.',
    companyId: 'SK9999999999',
    email: 'orders@retailhub.sk',
    status: 'Prijatá',
    total: 2750,
    items: [
      { name: 'SkyWiFi 6E Pro', quantity: 3, price: 890 },
      { name: 'Pulse Monitoring 24/7', quantity: 1, price: 80 }
    ],
    history: [{ status: 'Prijatá', timestamp: '2025-01-13 16:43' }],
    paymentMethod: 'Faktúra 14 dní',
    invoiceNumber: '—',
    assignedTo: 'Sales Support'
  }
];

export const sampleInvoices: InvoiceRecord[] = [
  {
    id: 'INV-FA-2025-00021',
    invoiceNumber: 'FA-2025-00021',
    variableSymbol: '202500021',
    customer: 'Inova Systems s.r.o.',
    issueDate: '2025-01-12',
    dueDate: '2025-01-26',
    total: 6890,
    currency: 'EUR',
    orderId: 'OBJ-2025-001'
  },
  {
    id: 'INV-FA-2025-00022',
    invoiceNumber: 'FA-2025-00022',
    variableSymbol: '202500022',
    customer: 'TechNordic a.s.',
    issueDate: '2025-01-11',
    dueDate: '2025-02-10',
    total: 5590,
    currency: 'EUR',
    orderId: 'OBJ-2025-002'
  }
];
