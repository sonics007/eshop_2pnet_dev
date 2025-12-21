import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Prostredie pre React komponenty
    environment: 'jsdom',

    // Setup súbory - spustia sa pred testami
    setupFiles: ['./tests/setup.ts'],

    // Glob patterns pre testové súbory
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'tests/integration/**/*.{test,spec}.{ts,tsx}'
    ],

    // Vylúčiť E2E testy (tie beží Playwright)
    exclude: [
      'node_modules',
      'tests/e2e/**/*',
      '.next/**/*'
    ],

    // Coverage nastavenia
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '.next/',
        '*.config.*',
        'prisma/'
      ]
    },

    // Globals - describe, it, expect bez importov
    globals: true,

    // Timeout pre pomalšie testy
    testTimeout: 10000
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
