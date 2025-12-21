import type { Product } from '@/types/product';
import { LANGUAGE_CURRENCY_MAP } from '@/types/product';
import type { PricingSettings } from '@/lib/modules/site/pages/pricing/types';
import { defaultPricingSettings } from '@/lib/modules/site/pages/pricing/types';

export type LocalizedPrice = {
  price: number;
  currency: string;
  locale: string;
  isConverted?: boolean; // true ak bola cena automaticky prepočítaná
};

/**
 * Prepočíta cenu z EUR na CZK podľa nastavení kurzu
 */
export function convertEurToCzk(eurPrice: number, settings?: PricingSettings | null): number {
  const config = settings ?? defaultPricingSettings;
  const converted = eurPrice * config.eurToCzkRate;

  if (config.roundTo <= 0) {
    return Math.round(converted);
  }
  if (config.roundUp) {
    return Math.ceil(converted / config.roundTo) * config.roundTo;
  }
  return Math.round(converted / config.roundTo) * config.roundTo;
}

/**
 * Vráti lokalizovanú cenu produktu
 * Ak produkt nemá preklad ceny pre daný jazyk a jazyk používa CZK,
 * automaticky prepočíta z EUR podľa nastavení kurzu
 */
export function getLocalizedPrice(
  product: Product,
  language: string,
  pricingSettings?: PricingSettings | null
): LocalizedPrice {
  const langConfig = LANGUAGE_CURRENCY_MAP[language] ?? LANGUAGE_CURRENCY_MAP.sk;
  const translation = product.translations?.[language];

  // Ak má preklad cenu, použijeme ju
  if (translation?.price !== undefined && translation.price !== null) {
    return {
      price: translation.price,
      currency: langConfig.currency,
      locale: langConfig.locale,
      isConverted: false
    };
  }

  // Ak je mena CZK a nemáme preklad, prepočítame z EUR
  if (langConfig.currency === 'CZK') {
    return {
      price: convertEurToCzk(product.price, pricingSettings),
      currency: 'CZK',
      locale: langConfig.locale,
      isConverted: true
    };
  }

  // Default - použijeme základnú cenu v EUR
  return {
    price: product.price,
    currency: langConfig.currency,
    locale: langConfig.locale,
    isConverted: false
  };
}

export function formatLocalizedPrice(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(value);
}
