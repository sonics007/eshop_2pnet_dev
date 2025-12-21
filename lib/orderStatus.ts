import { dbToStatus, statusToDb, type OrderStatus } from '@/types/orders';

/**
 * Mapuje DB status (PRIJATA, SPRACOVANIE...) na interný kód (new, processing...)
 */
export function mapStatus(dbStatus: string): OrderStatus {
  return dbToStatus[dbStatus] ?? 'new';
}

/**
 * Mapuje interný kód (new, processing...) na DB status (PRIJATA, SPRACOVANIE...)
 */
export function reverseStatus(status: OrderStatus): string {
  return statusToDb[status] ?? 'PRIJATA';
}
