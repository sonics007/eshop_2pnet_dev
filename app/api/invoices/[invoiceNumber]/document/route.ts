import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readInvoiceTemplate } from '@/lib/invoiceTemplate';
import { sampleInvoices, sampleOrders } from '@/lib/sampleData';

type DocumentInvoice = {
  invoiceNumber: string;
  variableSymbol: string;
  customerName: string;
  customerIco?: string;
  customerDic?: string;
  issueDate: string;
  dueDate: string;
  supplyDate: string;
  basePrice: number;
  vatValue: number;
  totalPrice: number;
  currency: string;
  vatRate: number;
  items: Array<{ name: string; quantity: number; price: number }>;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const formatDate = (value: Date | string) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value;

export async function GET(_: Request, { params }: { params: { invoiceNumber: string } }) {
  try {
    const template = await readInvoiceTemplate();
    const dbInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber: params.invoiceNumber },
      include: {
        order: {
          include: { items: true }
        }
      }
    });

    let invoice: DocumentInvoice | null = null;

    if (dbInvoice) {
      invoice = {
        invoiceNumber: dbInvoice.invoiceNumber,
        variableSymbol: dbInvoice.variableSymbol,
        customerName: dbInvoice.customerName,
        customerIco: dbInvoice.customerIco ?? undefined,
        customerDic: dbInvoice.customerDic ?? undefined,
        issueDate: formatDate(dbInvoice.issueDate),
        dueDate: formatDate(dbInvoice.dueDate),
        supplyDate: formatDate(dbInvoice.supplyDate ?? dbInvoice.issueDate),
        basePrice: dbInvoice.basePrice,
        vatValue: dbInvoice.vatValue,
        totalPrice: dbInvoice.totalPrice,
        currency: dbInvoice.currency,
        vatRate: template.defaults.vatRate * 100,
        items:
          dbInvoice.order?.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })) ?? []
      };
    } else {
      const sampleInvoice = sampleInvoices.find((item) => item.invoiceNumber === params.invoiceNumber);
      if (sampleInvoice) {
        const sampleOrder = sampleOrders.find((item) => item.id === sampleInvoice.orderId);
        invoice = {
          invoiceNumber: sampleInvoice.invoiceNumber,
          variableSymbol: sampleInvoice.variableSymbol,
          customerName: sampleInvoice.customer,
          customerIco: sampleOrder?.companyId,
          customerDic: sampleOrder?.companyId,
          issueDate: sampleInvoice.issueDate,
          dueDate: sampleInvoice.dueDate,
          supplyDate: sampleInvoice.issueDate,
          basePrice: sampleInvoice.total / (1 + template.defaults.vatRate),
          vatValue: sampleInvoice.total - sampleInvoice.total / (1 + template.defaults.vatRate),
          totalPrice: sampleInvoice.total,
          currency: sampleInvoice.currency,
          vatRate: template.defaults.vatRate * 100,
          items:
            sampleOrder?.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })) ?? []
        };
      }
    }

    if (!invoice) {
      return NextResponse.json({ success: false, message: 'Faktúra sa nenašla.' }, { status: 404 });
    }

    // TypeScript doesn't narrow properly here, so we use a const
    const inv = invoice;
    const itemsXml =
      inv.items.length > 0
        ? inv.items
            .map(
              (item, index) => `
  <InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${inv.currency}">${(item.price * item.quantity).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${escapeXml(item.name)}</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${inv.currency}">${item.price.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </InvoiceLine>`
            )
            .join('')
        : `
  <InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="EA">0</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${inv.currency}">0.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>Bez položiek</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${inv.currency}">0.00</cbc:PriceAmount>
    </cac:Price>
  </InvoiceLine>`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:cz:isdoc:invoice:1"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>${inv.invoiceNumber}</cbc:ID>
  <cbc:UUID>${inv.variableSymbol || inv.invoiceNumber}</cbc:UUID>
  <cbc:IssueDate>${inv.issueDate}</cbc:IssueDate>
  <cbc:DueDate>${inv.dueDate}</cbc:DueDate>
  <cbc:TaxPointDate>${inv.supplyDate}</cbc:TaxPointDate>
  <cbc:DocumentCurrencyCode>${inv.currency}</cbc:DocumentCurrencyCode>
  <cbc:Note>${escapeXml(template.phrases.legalNote)}</cbc:Note>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:Name>${escapeXml(template.supplier.name)}</cbc:Name>
      <cac:CompanyID>${escapeXml(template.supplier.ico)}</cac:CompanyID>
      <cbc:ID>${escapeXml(template.supplier.dic)}</cbc:ID>
      <cbc:AdditionalAccountID>${escapeXml(template.supplier.vatId ?? '')}</cbc:AdditionalAccountID>
      <cac:PostalAddress>
        <cbc:StreetName>${escapeXml(template.supplier.address)}</cbc:StreetName>
        <cbc:Country>Česká republika</cbc:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cbc:Name>${escapeXml(inv.customerName)}</cbc:Name>
      <cac:CompanyID>${escapeXml(inv.customerIco ?? '')}</cac:CompanyID>
      <cbc:ID>${escapeXml(inv.customerDic ?? '')}</cbc:ID>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${inv.currency}">${inv.vatValue.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${inv.currency}">${inv.basePrice.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${inv.currency}">${inv.vatValue.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>${inv.vatRate.toFixed(2)}</cbc:Percent>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${inv.currency}">${inv.basePrice.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${inv.currency}">${inv.basePrice.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${inv.currency}">${inv.totalPrice.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${inv.currency}">${inv.totalPrice.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

${itemsXml}
</Invoice>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${inv.invoiceNumber}.isdoc"`
      }
    });
  } catch (error) {
    console.error('Invoice ISDOC generation failed:', error);
    return NextResponse.json({ success: false, message: 'Dokument sa nepodarilo vygenerovať.' }, { status: 500 });
  }
}
