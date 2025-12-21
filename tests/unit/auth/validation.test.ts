/**
 * Auth Module - Login Validation Tests
 *
 * Testy pre validáciu prihlasovacích údajov
 */

import { describe, it, expect } from 'vitest'

// Validačné funkcie (extrahované z API routes)
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Heslo je povinné' }
  }
  if (password.length < 6) {
    return { valid: false, error: 'Heslo musí mať aspoň 6 znakov' }
  }
  return { valid: true }
}

function validateLoginCredentials(email: string, password: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email je povinný' }
  }
  if (!validateEmail(email)) {
    return { valid: false, error: 'Neplatný formát emailu' }
  }
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return passwordValidation
  }
  return { valid: true }
}

function validateRegistrationData(data: {
  email: string
  password: string
  companyName: string
  ico: string
  dic: string
}): { valid: boolean; error?: string } {
  if (!data.email || !data.password || !data.companyName || !data.ico || !data.dic) {
    return { valid: false, error: 'Vyplňte všetky povinné polia' }
  }
  if (!validateEmail(data.email)) {
    return { valid: false, error: 'Neplatný formát emailu' }
  }
  if (data.password.length < 6) {
    return { valid: false, error: 'Heslo musí mať aspoň 6 znakov' }
  }
  return { valid: true }
}

describe('Auth - Email Validation', () => {
  it('should accept valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@company.sk')).toBe(true)
    expect(validateEmail('admin@subdomain.example.org')).toBe(true)
  })

  it('should reject invalid email without @', () => {
    expect(validateEmail('testexample.com')).toBe(false)
  })

  it('should reject invalid email without domain', () => {
    expect(validateEmail('test@')).toBe(false)
  })

  it('should reject invalid email without local part', () => {
    expect(validateEmail('@example.com')).toBe(false)
  })

  it('should reject email with spaces', () => {
    expect(validateEmail('test @example.com')).toBe(false)
    expect(validateEmail('test@ example.com')).toBe(false)
  })

  it('should reject empty email', () => {
    expect(validateEmail('')).toBe(false)
  })
})

describe('Auth - Password Validation', () => {
  it('should accept valid password with 6+ characters', () => {
    expect(validatePassword('password123').valid).toBe(true)
    expect(validatePassword('123456').valid).toBe(true)
    expect(validatePassword('abcdef').valid).toBe(true)
  })

  it('should reject password shorter than 6 characters', () => {
    const result = validatePassword('12345')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Heslo musí mať aspoň 6 znakov')
  })

  it('should reject empty password', () => {
    const result = validatePassword('')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Heslo je povinné')
  })

  it('should accept password with special characters', () => {
    expect(validatePassword('p@ss!word#123').valid).toBe(true)
  })

  it('should accept long passwords', () => {
    expect(validatePassword('a'.repeat(100)).valid).toBe(true)
  })
})

describe('Auth - Login Credentials Validation', () => {
  it('should validate correct login credentials', () => {
    const result = validateLoginCredentials('user@example.com', 'password123')
    expect(result.valid).toBe(true)
  })

  it('should reject missing email', () => {
    const result = validateLoginCredentials('', 'password123')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Email je povinný')
  })

  it('should reject invalid email format', () => {
    const result = validateLoginCredentials('invalid-email', 'password123')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Neplatný formát emailu')
  })

  it('should reject short password', () => {
    const result = validateLoginCredentials('user@example.com', '12345')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Heslo musí mať aspoň 6 znakov')
  })
})

describe('Auth - Registration Validation', () => {
  const validData = {
    email: 'company@example.com',
    password: 'password123',
    companyName: 'Test Company s.r.o.',
    ico: '12345678',
    dic: 'SK1234567890'
  }

  it('should validate correct registration data', () => {
    const result = validateRegistrationData(validData)
    expect(result.valid).toBe(true)
  })

  it('should reject missing email', () => {
    const result = validateRegistrationData({ ...validData, email: '' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Vyplňte všetky povinné polia')
  })

  it('should reject missing company name', () => {
    const result = validateRegistrationData({ ...validData, companyName: '' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Vyplňte všetky povinné polia')
  })

  it('should reject missing ICO', () => {
    const result = validateRegistrationData({ ...validData, ico: '' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Vyplňte všetky povinné polia')
  })

  it('should reject missing DIC', () => {
    const result = validateRegistrationData({ ...validData, dic: '' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Vyplňte všetky povinné polia')
  })

  it('should reject invalid email in registration', () => {
    const result = validateRegistrationData({ ...validData, email: 'invalid-email' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Neplatný formát emailu')
  })

  it('should reject short password in registration', () => {
    const result = validateRegistrationData({ ...validData, password: '12345' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Heslo musí mať aspoň 6 znakov')
  })
})
