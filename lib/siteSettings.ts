import path from 'path';
import { readConfig, writeConfig } from '@/lib/configStore';
import { defaultSiteSettings, mergeSiteSettings, type SiteSettings } from '@/lib/siteSettingsShared';

const CONFIG_KEY = 'site-settings';
const legacyPath = path.join(process.cwd(), 'data', 'siteSettings.json');

export async function readSiteSettings(): Promise<SiteSettings> {
  const stored = await readConfig<SiteSettings>(CONFIG_KEY, defaultSiteSettings, legacyPath);
  return mergeSiteSettings(stored);
}

export async function writeSiteSettings(settings: SiteSettings) {
  const value = mergeSiteSettings(settings);
  await writeConfig(CONFIG_KEY, value);
}

export { defaultSiteSettings, type SiteSettings } from '@/lib/siteSettingsShared';
