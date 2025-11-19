import path from 'path';
import { readConfig, writeConfig } from '@/lib/configStore';

export type InvoiceTemplate = {
  supplier: {
    name: string;
    address: string;
    ico: string;
    dic: string;
    vatId?: string;
    bankAccount: string;
    iban: string;
    swift: string;
  };
  defaults: {
    currency: string;
    vatRate: number;
    dueDays: number;
    supplyDaysOffset: number;
  };
  phrases: {
    footerNote: string;
    legalNote: string;
    paymentInstructions: string;
  };
};

const CONFIG_KEY = 'invoice-template';
const legacyPath = path.join(process.cwd(), 'data', 'invoiceTemplate.json');

export const defaultInvoiceTemplate: InvoiceTemplate = {
  supplier: {
    name: '2Pnet s.r.o.',
    address: 'Štefánikova 802, 293 01 Mladá Boleslav',
    ico: '03599861',
    dic: 'CZ03599861',
    vatId: 'CZ03599861',
    bankAccount: '2101234567/2010',
    iban: 'CZ29 2010 0000 0021 0123 4567',
    swift: 'FIOBCZPPXXX'
  },
  defaults: {
    currency: 'CZK',
    vatRate: 0.21,
    dueDays: 14,
    supplyDaysOffset: 0
  },
  phrases: {
    footerNote: 'Ďakujeme za spoluprácu. V prípade dotazov kontaktujte billing@2pnet.cz.',
    legalNote: 'Dodávateľ je platcom DPH. Faktúra bola vystavená v súlade so zákonom o DPH.',
    paymentInstructions:
      'Uhrazujte prosím bankovým prevodom na účet uvedený vyššie. Variabilný symbol = číslo faktúry.'
  }
};

function mergeTemplate(payload: Partial<InvoiceTemplate> | null | undefined): InvoiceTemplate {
  return {
    supplier: { ...defaultInvoiceTemplate.supplier, ...(payload?.supplier ?? {}) },
    defaults: { ...defaultInvoiceTemplate.defaults, ...(payload?.defaults ?? {}) },
    phrases: { ...defaultInvoiceTemplate.phrases, ...(payload?.phrases ?? {}) }
  };
}

export async function readInvoiceTemplate(): Promise<InvoiceTemplate> {
  const stored = await readConfig<InvoiceTemplate>(CONFIG_KEY, defaultInvoiceTemplate, legacyPath);
  return mergeTemplate(stored);
}

export async function writeInvoiceTemplate(template: InvoiceTemplate) {
  const merged = mergeTemplate(template);
  await writeConfig(CONFIG_KEY, merged);
}
