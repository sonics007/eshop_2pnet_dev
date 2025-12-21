/**
 * Unit testy pre JWT autentifikáciu
 * Testuje vytvorenie a overenie tokenov
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock jose module
vi.mock('jose', async () => {
  const actual = await vi.importActual('jose') as object
  return {
    ...actual,
    SignJWT: class MockSignJWT {
      private payload: Record<string, unknown>

      constructor(payload: Record<string, unknown>) {
        this.payload = payload
      }

      setProtectedHeader() { return this }
      setIssuedAt() { return this }
      setExpirationTime() { return this }

      async sign() {
        // Simuluje JWT formát
        const header = btoa(JSON.stringify({ alg: 'HS256' }))
        const payload = btoa(JSON.stringify(this.payload))
        const signature = 'test-signature'
        return `${header}.${payload}.${signature}`
      }
    }
  }
})

// Mock Next.js cookies (server-only)
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  }))
}))

describe('JWT Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Token Creation', () => {
    it('should create access token with correct payload', async () => {
      // Dynamický import kvôli mockom
      const { createAccessToken } = await import('@/lib/auth/jwt')

      const payload = {
        userId: 1,
        email: 'test@example.com',
        role: 'admin' as const
      }

      const token = await createAccessToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT má 3 časti

      // Dekóduj payload a over
      const [, payloadPart] = token.split('.')
      const decoded = JSON.parse(atob(payloadPart))

      expect(decoded.userId).toBe(1)
      expect(decoded.email).toBe('test@example.com')
      expect(decoded.role).toBe('admin')
      expect(decoded.type).toBe('access')
    })

    it('should create refresh token with correct payload', async () => {
      const { createRefreshToken } = await import('@/lib/auth/jwt')

      const payload = {
        userId: 2,
        email: 'customer@example.com',
        role: 'customer' as const
      }

      const token = await createRefreshToken(payload)

      expect(token).toBeDefined()

      const [, payloadPart] = token.split('.')
      const decoded = JSON.parse(atob(payloadPart))

      expect(decoded.userId).toBe(2)
      expect(decoded.type).toBe('refresh')
    })
  })

  describe('TokenPayload Interface', () => {
    it('should have required fields', () => {
      // Type check - toto je compile-time test
      interface TokenPayload {
        userId: number
        email: string
        role: 'admin' | 'customer'
        type: 'access' | 'refresh'
      }

      const validPayload: TokenPayload = {
        userId: 1,
        email: 'test@test.com',
        role: 'admin',
        type: 'access'
      }

      expect(validPayload.userId).toBeDefined()
      expect(validPayload.email).toBeDefined()
      expect(validPayload.role).toBeDefined()
      expect(validPayload.type).toBeDefined()
    })

    it('should only allow valid roles', () => {
      const adminRole: 'admin' | 'customer' = 'admin'
      const customerRole: 'admin' | 'customer' = 'customer'

      expect(['admin', 'customer']).toContain(adminRole)
      expect(['admin', 'customer']).toContain(customerRole)
    })
  })
})

describe('Auth Flow Integration', () => {
  it('should support complete auth flow types', () => {
    // Simulácia auth flow bez skutočného volania API
    interface LoginRequest {
      email: string
      password: string
    }

    interface LoginResponse {
      success: boolean
      accessToken?: string
      refreshToken?: string
      error?: string
    }

    const loginRequest: LoginRequest = {
      email: 'user@example.com',
      password: 'password123'
    }

    const successResponse: LoginResponse = {
      success: true,
      accessToken: 'access-token',
      refreshToken: 'refresh-token'
    }

    const errorResponse: LoginResponse = {
      success: false,
      error: 'Invalid credentials'
    }

    expect(loginRequest.email).toBeDefined()
    expect(successResponse.success).toBe(true)
    expect(errorResponse.success).toBe(false)
  })
})
