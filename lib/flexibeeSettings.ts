import path from 'path';
import { readConfig, writeConfig } from '@/lib/configStore';

export type FlexibeeSettings = {
  url: string;
  company: string;
  username: string;
  password: string;
};

const CONFIG_KEY = 'flexibee-settings';
const legacyPath = path.join(process.cwd(), 'data', 'flexibee-settings.json');

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

export async function readFlexibeeSettings(): Promise<FlexibeeSettings> {
  const stored = await readConfig<FlexibeeSettings>(CONFIG_KEY, defaultFlexibeeSettings, legacyPath);
  return normalize(stored);
}

export async function writeFlexibeeSettings(settings: FlexibeeSettings) {
  const value = normalize(settings);
  await writeConfig(CONFIG_KEY, value);
}
