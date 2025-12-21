/**
 * Orders Module - Order Creation Tests
 *
 * Testy pre vytvorenie objednávok
 */

import { describe, it, expect, vi } from 'vitest'
import type { CreateOrderData, OrderStatus } from '@/lib/modules/orders/types'

// Helper funkcie extrahované z orders/service.ts
function generateExternalId(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD-${year}${month}-${random}`
}

function calculateOrderTotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

function validateOrderData(data: Partial<CreateOrderData>): { valid: boolean; error?: string } {
  if (!data.customerName?.trim()) {
    return { valid: false, error: 'Meno zákazníka je povinné' }
  }
  if (!data.customerEmail?.trim()) {
    return { valid: false, error: 'Email zákazníka je povinný' }
  }
  if (!data.items || data.items.length === 0) {
    return { valid: false, error: 'Objednávka musí obsahovať aspoň jednu položku' }
  }
  for (const item of data.items) {
    if (!item.name?.trim()) {
      return { valid: false, error: 'Každá položka musí mať názov' }
    }
    if (item.quantity <= 0) {
      return { valid: false, error: 'Množstvo musí byť väčšie ako 0' }
    }
    if (item.price < 0) {
      return { valid: false, error: 'Cena nemôže byť záporná' }
    }
  }
  return { valid: true }
}

describe('Orders - External ID Generation', () => {
  it('should generate ID with correct prefix', () => {
    const id = generateExternalId()

    expect(id.startsWith('ORD-')).toBe(true)
  })

  it('should include current year', () => {
    const id = generateExternalId()
    const currentYear = new Date().getFullYear()

    expect(id).toContain(String(currentYear))
  })

  it('should include current month padded', () => {
    const id = generateExternalId()
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')

    expect(id).toContain(currentMonth)
  })

  it('should generate unique IDs', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateExternalId())
    }

    // Should be mostly unique (random part)
    expect(ids.size).toBeGreaterThan(90)
  })

  it('should have correct format ORD-YYYYMM-XXXXXX', () => {
    const id = generateExternalId()

    expect(id).toMatch(/^ORD-\d{6}-[A-Z0-9]{6}$/)
  })
})

describe('Orders - Total Calculation', () => {
  it('should calculate total for single item', () => {
    const items = [{ price: 100, quantity: 1 }]
    const total = calculateOrderTotal(items)

    expect(total).toBe(100)
  })

  it('should calculate total with quantity', () => {
    const items = [{ price: 50, quantity: 3 }]
    const total = calculateOrderTotal(items)

    expect(total).toBe(150)
  })

  it('should calculate total for multiple items', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 },
      { price: 25, quantity: 4 }
    ]
    const total = calculateOrderTotal(items)

    expect(total).toBe(200 + 50 + 100)
  })

  it('should return 0 for empty items', () => {
    const items: { price: number; quantity: number }[] = []
    const total = calculateOrderTotal(items)

    expect(total).toBe(0)
  })

  it('should handle decimal prices', () => {
    const items = [
      { price: 19.99, quantity: 2 },
      { price: 5.50, quantity: 3 }
    ]
    const total = calculateOrderTotal(items)

    expect(total).toBeCloseTo(39.98 + 16.5, 2)
  })

  it('should handle large quantities', () => {
    const items = [{ price: 10, quantity: 1000 }]
    const total = calculateOrderTotal(items)

    expect(total).toBe(10000)
  })

  it('should handle zero price items', () => {
    const items = [
      { price: 0, quantity: 5 },
      { price: 100, quantity: 1 }
    ]
    const total = calculateOrderTotal(items)

    expect(total).toBe(100)
  })
})

describe('Orders - Order Validation', () => {
  const validOrderData: CreateOrderData = {
    customerName: 'Test Customer',
    customerEmail: 'customer@example.com',
    items: [
      { name: 'Product 1', price: 100, quantity: 1 }
    ]
  }

  it('should validate correct order data', () => {
    const result = validateOrderData(validOrderData)

    expect(result.valid).toBe(true)
  })

  it('should reject missing customer name', () => {
    const result = validateOrderData({
      ...validOrderData,
      customerName: ''
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Meno zákazníka je povinné')
  })

  it('should reject whitespace-only customer name', () => {
    const result = validateOrderData({
      ...validOrderData,
      customerName: '   '
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Meno zákazníka je povinné')
  })

  it('should reject missing email', () => {
    const result = validateOrderData({
      ...validOrderData,
      customerEmail: ''
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Email zákazníka je povinný')
  })

  it('should reject empty items array', () => {
    const result = validateOrderData({
      ...validOrderData,
      items: []
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Objednávka musí obsahovať aspoň jednu položku')
  })

  it('should reject item without name', () => {
    const result = validateOrderData({
      ...validOrderData,
      items: [{ name: '', price: 100, quantity: 1 }]
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Každá položka musí mať názov')
  })

  it('should reject item with zero quantity', () => {
    const result = validateOrderData({
      ...validOrderData,
      items: [{ name: 'Product', price: 100, quantity: 0 }]
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Množstvo musí byť väčšie ako 0')
  })

  it('should reject item with negative quantity', () => {
    const result = validateOrderData({
      ...validOrderData,
      items: [{ name: 'Product', price: 100, quantity: -1 }]
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Množstvo musí byť väčšie ako 0')
  })

  it('should reject item with negative price', () => {
    const result = validateOrderData({
      ...validOrderData,
      items: [{ name: 'Product', price: -10, quantity: 1 }]
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Cena nemôže byť záporná')
  })

  it('should accept item with zero price (free item)', () => {
    const result = validateOrderData({
      ...validOrderData,
      items: [{ name: 'Free Sample', price: 0, quantity: 1 }]
    })

    expect(result.valid).toBe(true)
  })

  it('should validate multiple items', () => {
    const result = validateOrderData({
      ...validOrderData,
      items: [
        { name: 'Product 1', price: 100, quantity: 2 },
        { name: 'Product 2', price: 50, quantity: 1 },
        { name: 'Product 3', price: 25, quantity: 5 }
      ]
    })

    expect(result.valid).toBe(true)
  })
})

describe('Orders - Order Data Structure', () => {
  it('should have all required fields', () => {
    const orderData: CreateOrderData = {
      customerName: 'Test',
      customerEmail: 'test@example.com',
      items: [{ name: 'Item', price: 10, quantity: 1 }]
    }

    expect(orderData.customerName).toBeDefined()
    expect(orderData.customerEmail).toBeDefined()
    expect(orderData.items).toBeDefined()
    expect(Array.isArray(orderData.items)).toBe(true)
  })

  it('should support optional fields', () => {
    const orderData: CreateOrderData = {
      customerName: 'Test',
      customerEmail: 'test@example.com',
      customerPhone: '+421900123456',
      customerAddress: 'Testovacia 1, Bratislava',
      paymentMethod: 'card',
      userId: 1,
      items: [{ name: 'Item', price: 10, quantity: 1 }]
    }

    expect(orderData.customerPhone).toBe('+421900123456')
    expect(orderData.customerAddress).toBe('Testovacia 1, Bratislava')
    expect(orderData.paymentMethod).toBe('card')
    expect(orderData.userId).toBe(1)
  })

  it('should handle item with optional productId', () => {
    const orderData: CreateOrderData = {
      customerName: 'Test',
      customerEmail: 'test@example.com',
      items: [
        { productId: 1, name: 'Linked Product', price: 100, quantity: 1 },
        { name: 'Custom Product', price: 50, quantity: 2 }
      ]
    }

    expect(orderData.items[0].productId).toBe(1)
    expect(orderData.items[1].productId).toBeUndefined()
  })
})
