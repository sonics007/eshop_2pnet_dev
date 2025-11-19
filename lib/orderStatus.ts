import type { AdminOrder } from '@/types/orders';

export function mapStatus(status: string): AdminOrder['status'] {
  switch (status) {
    case 'PRIJATA':
      return 'Prijatá';
    case 'SPRACOVANIE':
      return 'Spracovanie';
    case 'EXPEDOVANA':
      return 'Expedovaná';
    case 'DOKONCENA':
      return 'Dokončená';
    case 'STORNOVANA':
      return 'Stornovaná';
    default:
      return 'Prijatá';
  }
}

export function reverseStatus(status: AdminOrder['status']) {
  switch (status) {
    case 'Prijatá':
      return 'PRIJATA';
    case 'Spracovanie':
      return 'SPRACOVANIE';
    case 'Expedovaná':
      return 'EXPEDOVANA';
    case 'Dokončená':
      return 'DOKONCENA';
    case 'Stornovaná':
      return 'STORNOVANA';
    default:
      return 'PRIJATA';
  }
}
