import { prisma } from '@/lib/prisma';
import type { AdminOrder } from '@/types/orders';
import { readInvoiceTemplate, type InvoiceTemplate } from '@/lib/invoiceTemplate';

export type InvoicePayload = {
  orderId: string;
  templateVersion?: string;
};

export function calculateVat(baseValue: number, vatRate = 0.21) {
  const vat = Number((baseValue * vatRate).toFixed(2));
  return { baseValue, vat, total: Number((baseValue + vat).toFixed(2)) };
}

export function buildInvoiceNumber(sequence: number) {
  return `FA-${new Date().getFullYear()}-${String(sequence).padStart(5, '0')}`;
}

function addDays(base: Date, days: number) {
  const clone = new Date(base);
  clone.setDate(clone.getDate() + days);
  return clone;
}

export async function generateInvoiceFromOrder(order: AdminOrder, templateVersion = 'default') {
  const template = await readInvoiceTemplate();
  const issueDate = new Date();
  const dueDate = addDays(issueDate, template.defaults.dueDays);
  const supplyDate = addDays(issueDate, template.defaults.supplyDaysOffset);
  const { vat, total } = calculateVat(order.total, template.defaults.vatRate);
  const invoiceNumber = buildInvoiceNumber(Math.floor(Math.random() * 90000) + 10000);

  const invoice = {
    invoiceNumber,
    variableSymbol: order.id.replace(/\D/g, '').slice(0, 10) || invoiceNumber.replace(/\D/g, ''),
    supplierName: template.supplier.name,
    supplierIco: template.supplier.ico,
    supplierDic: template.supplier.dic,
    supplierVatId: template.supplier.vatId,
    supplierAddress: template.supplier.address,
    customerName: order.customer,
    customerIco: order.companyId,
    customerDic: order.companyId,
    customerVatId: order.companyId?.startsWith('CZ') ? order.companyId : undefined,
    customerAddress: order.customer,
    issueDate: issueDate.toISOString().slice(0, 10),
    dueDate: dueDate.toISOString().slice(0, 10),
    supplyDate: supplyDate.toISOString().slice(0, 10),
    basePrice: order.total,
    vatValue: vat,
    totalPrice: total,
    currency: template.defaults.currency,
    orderId: order.id,
    templateVersion
  };

  return { invoice, template };
}

export async function persistInvoice(invoiceData: Awaited<ReturnType<typeof generateInvoiceFromOrder>>['invoice']) {
  try {
    const invoice = await prisma.invoice.create({
      data: invoiceData
    });
    return invoice;
  } catch (error) {
    console.error('DB invoice fallback (likely no DB configured yet):', error);
    return {
      id: `INV-${invoiceData.invoiceNumber}`,
      ...invoiceData,
      createdAt: new Date().toISOString()
    };
  }
}

export type GeneratedInvoice = Awaited<ReturnType<typeof generateInvoiceFromOrder>> & { template: InvoiceTemplate };
