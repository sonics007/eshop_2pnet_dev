import path from 'path';
import crypto from 'crypto';
import { readConfig, writeConfig } from '@/lib/configStore';

export type FlexibeeSettings = {
  url: string;
  company: string;
  username: string;
  password: string;
};

const CONFIG_KEY = 'flexibee-settings';
const legacyPath = path.join(process.cwd(), 'data', 'flexibee-settings.json');
const ENCRYPTION_SECRET =
  process.env.FLEXIBEE_ENCRYPTION_KEY || process.env.CONFIG_CRYPTO_KEY || process.env.JWT_SECRET || '';
const ENCRYPTION_KEY = ENCRYPTION_SECRET
  ? crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest()
  : null;

// Varovanie ak šifrovanie nie je nastavené v produkcii
if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  console.warn('[SECURITY] CONFIG_CRYPTO_KEY nie je nastavený. FlexiBee heslo nebude šifrované!');
}

export const defaultFlexibeeSettings: FlexibeeSettings = {
  url: '',
  company: '',
  username: '',
  password: ''
};

function normalize(payload: Partial<FlexibeeSettings> | null | undefined): FlexibeeSettings {
  const data = payload ?? {};
  return {
    url: data.url ?? '',
    company: data.company ?? '',
    username: data.username ?? '',
    password: data.password ?? ''
  };
}

function encryptSensitive(value: string) {
  if (!value) return '';
  if (!ENCRYPTION_KEY) return value;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSensitive(value?: string | null) {
  if (!value) return '';
  if (!ENCRYPTION_KEY) return value;
  const [ivHex, dataHex] = value.split(':');
  if (!ivHex || !dataHex) {
    return value;
  }
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-ctr', ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return value;
  }
}

export async function readFlexibeeSettings(): Promise<FlexibeeSettings> {
  const stored = await readConfig<FlexibeeSettings>(CONFIG_KEY, defaultFlexibeeSettings, legacyPath);
  const normalized = normalize(stored);
  return {
    ...normalized,
    password: decryptSensitive(normalized.password)
  };
}

export async function writeFlexibeeSettings(settings: FlexibeeSettings) {
  const value = normalize(settings);
  value.password = encryptSensitive(value.password);
  await writeConfig(CONFIG_KEY, value);
}
