/**
 * SITE MODULE - Main Export
 * Agreguje všetky pod-moduly zo zložky pages/
 */

// Export všetkých stránkových modulov (visual, links, menu)
export * from './pages';

// Compatibility layer pre spätnú kompatibilitu so starým siteSettings
import type { VisualSettings } from './pages/visual';
import type { LinkSettings } from './pages/links';

/**
 * @deprecated Použite samostatné moduly: pages/visual, pages/links, pages/menu
 */
export interface LegacySiteSettings {
  hero: VisualSettings;
  links: LinkSettings;
}
