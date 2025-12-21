/**
 * PRICING SETTINGS - Service
 *
 * Správa konverzného kurzu EUR → CZK
 */

import { readConfig, writeConfig } from '@/lib/configStore';
import { defaultPricingSettings } from './types';
import type { PricingSettings } from './types';

const CONFIG_KEY = 'pricing-settings';

export async function getPricingSettings(): Promise<PricingSettings> {
  const stored = await readConfig<PricingSettings>(CONFIG_KEY, defaultPricingSettings);
  return {
    eurToCzkRate: stored.eurToCzkRate ?? defaultPricingSettings.eurToCzkRate,
    roundTo: stored.roundTo ?? defaultPricingSettings.roundTo,
    roundUp: stored.roundUp ?? defaultPricingSettings.roundUp
  };
}

export async function savePricingSettings(settings: Partial<PricingSettings>): Promise<PricingSettings> {
  const current = await getPricingSettings();
  const merged: PricingSettings = {
    eurToCzkRate: settings.eurToCzkRate ?? current.eurToCzkRate,
    roundTo: settings.roundTo ?? current.roundTo,
    roundUp: settings.roundUp ?? current.roundUp
  };
  await writeConfig(CONFIG_KEY, merged);
  return merged;
}

/**
 * Prepočíta cenu z EUR na CZK podľa aktuálneho kurzu
 */
export function convertEurToCzk(eurPrice: number, settings: PricingSettings): number {
  const converted = eurPrice * settings.eurToCzkRate;

  if (settings.roundTo <= 0) {
    return Math.round(converted);
  }

  if (settings.roundUp) {
    return Math.ceil(converted / settings.roundTo) * settings.roundTo;
  }

  return Math.round(converted / settings.roundTo) * settings.roundTo;
}
