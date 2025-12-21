/**
 * API Test Helpers
 * Utility funkcie pre testovanie API routes
 */

import { vi } from 'vitest';

/**
 * Vytvorí mock Request objekt
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Request {
  const { method = 'GET', url = 'http://localhost:3000/api/test', body, headers = {} } = options;

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  return new Request(url, init);
}

/**
 * Mock pre NextResponse
 */
export function createMockNextResponse() {
  return {
    json: vi.fn((data: unknown, init?: ResponseInit) => ({
      status: init?.status || 200,
      json: async () => data
    }))
  };
}

/**
 * Extrahuje JSON body z Response
 */
export async function getResponseJson<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Mock cookies store pre testy
 */
export function createMockCookieStore() {
  const cookies = new Map<string, { value: string; options?: unknown }>();

  return {
    get: vi.fn((name: string) => {
      const cookie = cookies.get(name);
      return cookie ? { name, value: cookie.value } : undefined;
    }),
    set: vi.fn((name: string, value: string, options?: unknown) => {
      cookies.set(name, { value, options });
    }),
    delete: vi.fn((name: string) => {
      cookies.delete(name);
    }),
    getAll: vi.fn(() => Array.from(cookies.entries()).map(([name, { value }]) => ({ name, value }))),
    _store: cookies
  };
}

/**
 * Helper pre volanie API route handlera
 */
export async function callApiHandler<T>(
  handler: (request: Request) => Promise<Response>,
  options: {
    method?: string;
    url?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<{ status: number; data: T }> {
  const request = createMockRequest(options);
  const response = await handler(request);
  const data = await response.json() as T;
  return { status: response.status, data };
}

/**
 * Generuje unikátny email pre testy
 */
export function generateTestEmail(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}@test.example.com`;
}

/**
 * Generuje unikátny slug pre testy
 */
export function generateTestSlug(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
