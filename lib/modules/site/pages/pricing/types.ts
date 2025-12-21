/**
 * PRICING SETTINGS - Types
 *
 * Nastavenia konverzného kurzu EUR → CZK
 */

export type PricingSettings = {
  // Konverzný kurz EUR → CZK (napr. 25.5 znamená 1 EUR = 25.5 CZK)
  eurToCzkRate: number;
  // Zaokrúhľovanie (0 = bez zaokrúhľovania, 10 = na desiatky, 100 = na stovky)
  roundTo: number;
  // Zaokrúhľovať nahor alebo nadol
  roundUp: boolean;
};

export const defaultPricingSettings: PricingSettings = {
  eurToCzkRate: 25.0,
  roundTo: 0,
  roundUp: false
};
