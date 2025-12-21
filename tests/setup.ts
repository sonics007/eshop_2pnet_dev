/**
 * Vitest Setup File
 * Spúšťa sa pred každým testovacím súborom
 */

import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Environment variables pre testy
process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests'
process.env.CONFIG_CRYPTO_KEY = 'test-crypto-key'
// NODE_ENV je nastavené cez vitest.config.ts

// Automaticky vyčistiť DOM po každom teste
afterEach(() => {
  cleanup()
})

// Mock pre Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({})
}))

// Mock pre Next.js Image komponent (bez JSX - používa createElement)
vi.mock('next/image', () => ({
  default: function MockImage(props: { src: string; alt: string; [key: string]: unknown }) {
    // Vráti null - pre unit testy nepotrebujeme skutočný element
    return null
  }
}))

// Mock pre Next.js cookies (potrebné pre auth testy)
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }))
}))

// Globálne mock pre fetch ak je potrebné
global.fetch = vi.fn()

// Reset všetkých mockov po každom teste
afterEach(() => {
  vi.clearAllMocks()
})

// Console error handler pre lepšie debugovanie
const originalError = console.error
console.error = (...args) => {
  // Ignorovať známe React warnings v testoch
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
     args[0].includes('Warning: An update to') ||
     args[0].includes('act(...)') ||
     args[0].includes('Token verification failed') ||
     args[0].includes('DB invoice fallback'))
  ) {
    return
  }
  originalError.call(console, ...args)
}
