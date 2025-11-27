/**
 * LINKS MODULE - Service
 * Biznis logika pre správu odkazov
 */

import { readConfig, writeConfig } from '@/lib/configStore';
import { defaultLinkSettings, type LinkSettings } from './types';
import path from 'path';

const CONFIG_KEY = 'site-links';
const legacyPath = path.join(process.cwd(), 'data', 'siteSettings.json');

/**
 * Mergne partial nastavenia s defaultmi
 */
export function mergeLinkSettings(payload: Partial<LinkSettings> | null | undefined): LinkSettings {
  const p = payload ?? {};
  return {
    logoPrimaryLink: p.logoPrimaryLink ?? defaultLinkSettings.logoPrimaryLink,
    logoAdminLink: p.logoAdminLink ?? defaultLinkSettings.logoAdminLink,
    footerLinks: p.footerLinks ?? defaultLinkSettings.footerLinks
  };
}

/**
 * Načíta nastavenia linkov
 */
export async function readLinkSettings(): Promise<LinkSettings> {
  const stored = await readConfig<LinkSettings>(CONFIG_KEY, defaultLinkSettings, legacyPath);
  return mergeLinkSettings(stored);
}

/**
 * Zapíše nastavenia linkov
 */
export async function writeLinkSettings(settings: Partial<LinkSettings>): Promise<LinkSettings> {
  const merged = mergeLinkSettings(settings);
  await writeConfig(CONFIG_KEY, merged);
  return merged;
}
