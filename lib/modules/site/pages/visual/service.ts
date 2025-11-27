/**
 * VISUAL MODULE - Service
 * Biznis logika pre správu vizuálnych nastavení
 */

import { readConfig, writeConfig } from '@/lib/configStore';
import { defaultVisualSettings, type VisualSettings } from './types';
import path from 'path';

const CONFIG_KEY = 'site-visual';
const legacyPath = path.join(process.cwd(), 'data', 'siteSettings.json');

/**
 * Mergne partial nastavenia s defaultmi
 */
export function mergeVisualSettings(payload: Partial<VisualSettings> | null | undefined): VisualSettings {
  const p = payload ?? {};
  return {
    backgroundImage: p.backgroundImage ?? defaultVisualSettings.backgroundImage,
    carouselImages: p.carouselImages ?? defaultVisualSettings.carouselImages,
    title: p.title ?? defaultVisualSettings.title,
    description: p.description ?? defaultVisualSettings.description,
    primaryCtaLabel: p.primaryCtaLabel ?? defaultVisualSettings.primaryCtaLabel,
    primaryCtaLink: p.primaryCtaLink ?? defaultVisualSettings.primaryCtaLink,
    secondaryCtaLabel: p.secondaryCtaLabel ?? defaultVisualSettings.secondaryCtaLabel,
    secondaryCtaLink: p.secondaryCtaLink ?? defaultVisualSettings.secondaryCtaLink,
    highlights: p.highlights ?? defaultVisualSettings.highlights
  };
}

/**
 * Načíta vizuálne nastavenia
 */
export async function readVisualSettings(): Promise<VisualSettings> {
  const stored = await readConfig<VisualSettings>(CONFIG_KEY, defaultVisualSettings, legacyPath);
  return mergeVisualSettings(stored);
}

/**
 * Zapíše vizuálne nastavenia
 */
export async function writeVisualSettings(settings: Partial<VisualSettings>): Promise<VisualSettings> {
  const merged = mergeVisualSettings(settings);
  await writeConfig(CONFIG_KEY, merged);
  return merged;
}
