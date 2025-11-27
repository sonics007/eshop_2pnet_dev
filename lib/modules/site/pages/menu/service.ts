/**
 * MENU MODULE - Service
 * Biznis logika pre správu menu
 */

import { readConfig, writeConfig } from '@/lib/configStore';
import { defaultMenuSettings, type MenuSettings } from './types';
import path from 'path';

const CONFIG_KEY = 'site-menu';
const legacyPath = path.join(process.cwd(), 'data', 'menuSettings.json');

/**
 * Mergne partial nastavenia s defaultmi
 */
export function mergeMenuSettings(payload: Partial<MenuSettings> | null | undefined): MenuSettings {
  const p = payload ?? {};
  return {
    mainMenu: p.mainMenu ?? defaultMenuSettings.mainMenu,
    footerMenu: p.footerMenu ?? defaultMenuSettings.footerMenu,
    mobileMenuEnabled: p.mobileMenuEnabled ?? defaultMenuSettings.mobileMenuEnabled
  };
}

/**
 * Načíta nastavenia menu
 */
export async function readMenuSettings(): Promise<MenuSettings> {
  const stored = await readConfig<MenuSettings>(CONFIG_KEY, defaultMenuSettings, legacyPath);
  return mergeMenuSettings(stored);
}

/**
 * Zapíše nastavenia menu
 */
export async function writeMenuSettings(settings: Partial<MenuSettings>): Promise<MenuSettings> {
  const merged = mergeMenuSettings(settings);
  await writeConfig(CONFIG_KEY, merged);
  return merged;
}
