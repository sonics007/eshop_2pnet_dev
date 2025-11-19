import { readFlexibeeSettings, type FlexibeeSettings } from '@/lib/flexibeeSettings';

type FlexibeeInvoiceItem = {
  name: string;
  quantity: number;
  price: number;
};

export type FlexibeeInvoicePayload = {
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
  items: FlexibeeInvoiceItem[];
};

export type FlexibeeConfig = {
  baseUrl: string;
  company: string;
  username: string;
  password: string;
};

const emptySettings: FlexibeeSettings = { url: '', company: '', username: '', password: '' };

async function resolveFlexibeeConfig(): Promise<FlexibeeConfig> {
  const envConfig: FlexibeeSettings = {
    url: process.env.FLEXIBEE_URL?.trim() ?? '',
    company: process.env.FLEXIBEE_COMPANY?.trim() ?? '',
    username: process.env.FLEXIBEE_USERNAME?.trim() ?? '',
    password: process.env.FLEXIBEE_PASSWORD?.trim() ?? ''
  };

  const stored = await readFlexibeeSettings().catch(() => emptySettings);
  const final = {
    url: envConfig.url || stored.url,
    company: envConfig.company || stored.company,
    username: envConfig.username || stored.username,
    password: envConfig.password || stored.password
  };

  if (!final.url || !final.company || !final.username || !final.password) {
    throw new Error('FlexiBee prístup nie je nastavený (.env alebo admin nastavenia).');
  }

  return {
    baseUrl: final.url.replace(/\/$/, ''),
    company: final.company,
    username: final.username,
    password: final.password
  };
}

export async function isFlexibeeConfigured() {
  try {
    await resolveFlexibeeConfig();
    return true;
  } catch {
    return false;
  }
}

async function buildAuthHeader() {
  const config = await resolveFlexibeeConfig();
  const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
  return { config, authorization: `Basic ${credentials}` };
}

export async function sendInvoiceToFlexibee(payload: FlexibeeInvoicePayload) {
  const { config, authorization } = await buildAuthHeader();
  const endpoint = `${config.baseUrl}/${config.company}/faktura-vydana.json`;

  const requestBody = {
    winstrom: {
      'faktura-vydana': [
        {
          kod: payload.invoiceNumber,
          varSym: payload.variableSymbol || payload.invoiceNumber.replace(/\D/g, '').slice(0, 10),
          vystaveno: payload.issueDate,
          datSplat: payload.dueDate,
          sumCelkem: payload.totalPrice,
          mena: payload.currency,
          text: 'Automaticky importované z 2Pnet e-shopu',
          osvobDph: false,
          odbm: {
            nazFirmy: payload.customerName,
            ico: payload.customerIco ?? '',
            dic: payload.customerDic ?? '',
            email: payload.customerEmail ?? ''
          },
          polozkyFaktury: payload.items.map((item) => ({
            nazPol: item.name,
            mnozMj: item.quantity,
            sumZkl: Number((item.price * item.quantity).toFixed(2)),
            cenaMj: Number(item.price.toFixed(2))
          }))
        }
      ]
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response
    .json()
    .catch(() => ({ error: { message: response.statusText || 'Neznáma chyba FlexiBee.' } }));

  const apiError = (data as any)?.winstrom?.error?.message || (data as any)?.error?.message;

  if (!response.ok || apiError) {
    throw new Error(apiError || 'FlexiBee API vrátilo chybu.');
  }

  return data;
}

export async function testFlexibeeConnection() {
  const { config, authorization } = await buildAuthHeader();
  const endpoint = `${config.baseUrl}/${config.company}/faktura-vydana.json?limit=1`;
  const response = await fetch(endpoint, {
    headers: { Authorization: authorization }
  });
  if (!response.ok) {
    throw new Error(`Test zlyhal s kódom ${response.status}.`);
  }
  return true;
}

export async function downloadFlexibeeIsdoc(invoiceNumber: string) {
  const { config, authorization } = await buildAuthHeader();
  const safeCode = encodeURIComponent(invoiceNumber);
  const endpoint = `${config.baseUrl}/${config.company}/faktura-vydana/${safeCode}.isdoc`;
  const response = await fetch(endpoint, {
    headers: { Authorization: authorization }
  });
  if (!response.ok) {
    throw new Error(`FlexiBee ISDOC export zlyhal s kódom ${response.status}.`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), fileName: `${invoiceNumber}.isdoc` };
}
