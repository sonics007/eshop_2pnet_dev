import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright konfigurácia pre E2E testy eshopu
 * Dokumentácia: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Priečinok s E2E testami
  testDir: './tests/e2e',

  // Pattern pre testové súbory
  testMatch: '**/*.{test,spec}.ts',

  // Paralelné spúšťanie testov
  fullyParallel: true,

  // Zakázať retry v CI, povoliť lokálne
  retries: process.env.CI ? 2 : 0,

  // Počet workerov
  workers: process.env.CI ? 1 : undefined,

  // Reporter - HTML report pre detailnú analýzu
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Globálne nastavenia pre všetky testy
  use: {
    // Base URL pre navigáciu
    baseURL: 'http://localhost:3000',

    // Screenshot pri chybe
    screenshot: 'only-on-failure',

    // Video pri chybe
    video: 'retain-on-failure',

    // Trace pri chybe - pre debugging
    trace: 'retain-on-failure',

    // Timeout pre akcie
    actionTimeout: 10000
  },

  // Timeout pre jednotlivé testy
  timeout: 30000,

  // Projekty - rôzne prehliadače
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    // Mobile viewporty pre responsívne testy
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],

  // Webserver - automaticky spustí dev server pred testami
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  // Output directory pre artefakty
  outputDir: 'test-results'
})
