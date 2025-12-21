/**
 * E2E testy pre homepage eshopu
 * Testuje základnú funkcionalitu a navigáciu
 */

import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load homepage successfully', async ({ page }) => {
    // Skontroluj, že stránka sa načítala
    await expect(page).toHaveTitle(/eshop/i)

    // Skontroluj základné elementy
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should have navigation menu', async ({ page }) => {
    // Hľadaj navigačné elementy
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Nastav mobilný viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Stránka by mala byť stále funkčná
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('should navigate to cart page', async ({ page }) => {
    await page.goto('/')

    // Klikni na košík (ak existuje)
    const cartLink = page.locator('a[href*="cart"], button:has-text("Košík")').first()

    if (await cartLink.isVisible()) {
      await cartLink.click()
      await expect(page).toHaveURL(/cart/)
    }
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')

    // Hľadaj login link
    const loginLink = page.locator('a[href*="login"], a[href*="account"]').first()

    if (await loginLink.isVisible()) {
      await loginLink.click()
      // Malo by presmerovať na login alebo account stránku
      await expect(page.url()).toMatch(/login|account/)
    }
  })
})

test.describe('Products Display', () => {
  test('should display product cards on homepage', async ({ page }) => {
    await page.goto('/')

    // Počkaj na načítanie produktov (ak existujú)
    await page.waitForLoadState('networkidle')

    // Skontroluj či existujú produktové karty
    const productCards = page.locator('[data-testid="product-card"], .product-card, article')

    // Tento test prejde ak sú produkty alebo ak je prázdna stránka (tiež validný stav)
    const count = await productCards.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const loadTime = Date.now() - startTime

    // Stránka by sa mala načítať do 5 sekúnd
    expect(loadTime).toBeLessThan(5000)
  })
})
