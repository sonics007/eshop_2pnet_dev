/**
 * CHAT MODULE - Exports
 *
 * Centrálny export pre chat modul.
 * POZOR: service.ts sa neexportuje cez tento súbor,
 * pretože obsahuje Node.js moduly (fs, prisma).
 * Pre service funkcie použite priamy import:
 * import { getChatSettings } from '@/lib/modules/chat/service';
 */

// Types only - safe for client-side
export * from './types';
