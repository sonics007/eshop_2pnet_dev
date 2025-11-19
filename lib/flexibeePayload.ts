import { prisma } from '@/lib/prisma';
import { sampleInvoices, sampleOrders } from '@/lib/sampleData';

type InvoicePayload = {
  invoiceNumber: string;
  variableSymbol: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  totalPrice: number;
  customerName: string;
  customerIco?: string;
  customerDic?: string;
  customerEmail?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
};

const toISO = (value: Date | string) => (value instanceof Date ? value.toISOString().slice(0, 10) : value);

export async function buildFlexibeeInvoicePayload(invoiceNumber: string): Promise<InvoicePayload | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: { order: { include: { items: true } } }
  });

  if (invoice) {
    return {
      invoiceNumber: invoice.invoiceNumber,
      variableSymbol: invoice.variableSymbol,
      issueDate: toISO(invoice.issueDate),
      dueDate: toISO(invoice.dueDate),
      currency: invoice.currency,
      totalPrice: invoice.totalPrice,
      customerName: invoice.customerName,
      customerIco: invoice.customerIco ?? undefined,
      customerDic: invoice.customerDic ?? undefined,
      customerEmail: invoice.order?.email ?? undefined,
      items:
        invoice.order?.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })) ?? []
    };
  }

  const sampleInvoice = sampleInvoices.find((item) => item.invoiceNumber === invoiceNumber);
  if (sampleInvoice) {
    const sampleOrder = sampleOrders.find((item) => item.id === sampleInvoice.orderId);
    return {
      invoiceNumber: sampleInvoice.invoiceNumber,
      variableSymbol: sampleInvoice.variableSymbol,
      issueDate: sampleInvoice.issueDate,
      dueDate: sampleInvoice.dueDate,
      currency: sampleInvoice.currency,
      totalPrice: sampleInvoice.total,
      customerName: sampleInvoice.customer,
      customerIco: sampleOrder?.companyId,
      customerDic: sampleOrder?.companyId,
      customerEmail: sampleOrder?.email,
      items:
        sampleOrder?.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })) ?? []
    };
  }

  return null;
}
