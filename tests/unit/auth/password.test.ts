/**
 * Auth Module - Password Hashing Tests
 *
 * Testy pre hashovanie a overovanie hesiel pomocou bcrypt
 */

import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'

describe('Auth - Password Hashing', () => {
  const testPassword = 'SecurePassword123!'
  const saltRounds = 10

  describe('bcrypt.hash()', () => {
    it('should hash password successfully', async () => {
      const hash = await bcrypt.hash(testPassword, saltRounds)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(testPassword)
      expect(hash.startsWith('$2')).toBe(true) // bcrypt prefix
    })

    it('should generate different hashes for same password', async () => {
      const hash1 = await bcrypt.hash(testPassword, saltRounds)
      const hash2 = await bcrypt.hash(testPassword, saltRounds)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty password', async () => {
      const hash = await bcrypt.hash('', saltRounds)

      expect(hash).toBeDefined()
      expect(hash.startsWith('$2')).toBe(true)
    })

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(72) // bcrypt limit is 72 bytes
      const hash = await bcrypt.hash(longPassword, saltRounds)

      expect(hash).toBeDefined()
    })

    it('should handle special characters', async () => {
      const specialPassword = 'P@$$w0rd!#€ľščťžýáíé'
      const hash = await bcrypt.hash(specialPassword, saltRounds)

      expect(hash).toBeDefined()
    })
  })

  describe('bcrypt.compare()', () => {
    it('should verify correct password', async () => {
      const hash = await bcrypt.hash(testPassword, saltRounds)
      const isValid = await bcrypt.compare(testPassword, hash)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const hash = await bcrypt.hash(testPassword, saltRounds)
      const isValid = await bcrypt.compare('WrongPassword', hash)

      expect(isValid).toBe(false)
    })

    it('should reject similar but different password', async () => {
      const hash = await bcrypt.hash(testPassword, saltRounds)
      const isValid = await bcrypt.compare(testPassword + ' ', hash)

      expect(isValid).toBe(false)
    })

    it('should be case sensitive', async () => {
      const hash = await bcrypt.hash(testPassword, saltRounds)
      const isValid = await bcrypt.compare(testPassword.toLowerCase(), hash)

      expect(isValid).toBe(false)
    })

    it('should handle empty password comparison', async () => {
      const hash = await bcrypt.hash('', saltRounds)

      expect(await bcrypt.compare('', hash)).toBe(true)
      expect(await bcrypt.compare('anything', hash)).toBe(false)
    })
  })

  describe('Salt Rounds', () => {
    it('should work with minimum salt rounds', async () => {
      const hash = await bcrypt.hash(testPassword, 4) // minimum recommended
      const isValid = await bcrypt.compare(testPassword, hash)

      expect(isValid).toBe(true)
    })

    it('should work with high salt rounds', async () => {
      const hash = await bcrypt.hash(testPassword, 12)
      const isValid = await bcrypt.compare(testPassword, hash)

      expect(isValid).toBe(true)
    })

    it('should produce different hash lengths based on algorithm', async () => {
      const hash = await bcrypt.hash(testPassword, saltRounds)

      // bcrypt hash is always 60 characters
      expect(hash.length).toBe(60)
    })
  })

  describe('Password Migration (plain text to bcrypt)', () => {
    // Simulácia migrácie z plain text hesiel na bcrypt

    it('should detect bcrypt hash by prefix', () => {
      const bcryptHash = '$2a$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456'
      const plainText = 'admin123'

      expect(bcryptHash.startsWith('$2')).toBe(true)
      expect(plainText.startsWith('$2')).toBe(false)
    })

    it('should verify password based on storage type', async () => {
      const password = 'testPassword'
      const bcryptHash = await bcrypt.hash(password, saltRounds)
      const plainTextHash = password // simulácia starého systému

      // Bcrypt verifikácia
      if (bcryptHash.startsWith('$2')) {
        expect(await bcrypt.compare(password, bcryptHash)).toBe(true)
      }

      // Plain text verifikácia (pre spätnú kompatibilitu)
      if (!plainTextHash.startsWith('$2')) {
        expect(plainTextHash === password).toBe(true)
      }
    })
  })
})

describe('Auth - Password Strength', () => {
  function checkPasswordStrength(password: string): {
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) score++
    else feedback.push('Heslo by malo mať aspoň 8 znakov')

    if (/[a-z]/.test(password)) score++
    else feedback.push('Heslo by malo obsahovať malé písmená')

    if (/[A-Z]/.test(password)) score++
    else feedback.push('Heslo by malo obsahovať veľké písmená')

    if (/[0-9]/.test(password)) score++
    else feedback.push('Heslo by malo obsahovať čísla')

    if (/[^a-zA-Z0-9]/.test(password)) score++
    else feedback.push('Heslo by malo obsahovať špeciálne znaky')

    return { score, feedback }
  }

  it('should rate weak password (only lowercase)', () => {
    const result = checkPasswordStrength('password')
    expect(result.score).toBe(2) // length + lowercase
    expect(result.feedback.length).toBe(3)
  })

  it('should rate medium password', () => {
    const result = checkPasswordStrength('Password1')
    expect(result.score).toBe(4) // length + lower + upper + number
    expect(result.feedback.length).toBe(1)
  })

  it('should rate strong password', () => {
    const result = checkPasswordStrength('Password1!')
    expect(result.score).toBe(5) // all criteria met
    expect(result.feedback.length).toBe(0)
  })

  it('should rate very short password', () => {
    const result = checkPasswordStrength('abc')
    expect(result.score).toBeLessThan(3)
    expect(result.feedback).toContain('Heslo by malo mať aspoň 8 znakov')
  })
})
