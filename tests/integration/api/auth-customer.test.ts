/**
 * Customer Authentication API Tests
 * Testy pre POST /api/auth/customer/login a /register
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestPrisma, closeTestPrisma, createTestCustomer } from '../../helpers/testDb';
import { createMockRequest, generateTestEmail } from '../../helpers/apiTestHelpers';
import { POST as loginHandler } from '@/app/api/auth/customer/login/route';
import { POST as registerHandler } from '@/app/api/auth/customer/register/route';

const prisma = getTestPrisma();

describe('Customer Authentication API', () => {
  beforeAll(async () => {
    // Vyčisti pred testami
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.example.com' } }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { contains: '@test.example.com' } }
    });
    await closeTestPrisma();
  });

  describe('POST /api/auth/customer/login', () => {
    let testEmail: string;
    const testPassword = 'TestPassword123';

    beforeEach(async () => {
      testEmail = generateTestEmail('login');
      await createTestCustomer(prisma, {
        email: testEmail,
        password: testPassword
      });
    });

    it('should successfully login with valid credentials', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/login',
        body: {
          email: testEmail,
          password: testPassword
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testEmail.toLowerCase());
      expect(data.user.role).toBe('customer');
    });

    it('should return 400 for missing email', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/login',
        body: {
          password: testPassword
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('povinné');
    });

    it('should return 400 for missing password', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/login',
        body: {
          email: testEmail
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 401 for invalid password', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/login',
        body: {
          email: testEmail,
          password: 'wrongPassword'
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Nesprávny');
    });

    it('should return 401 for non-existent user', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/login',
        body: {
          email: 'nonexistent@test.example.com',
          password: 'anyPassword'
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should handle case-insensitive email login', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/login',
        body: {
          email: testEmail.toUpperCase(),
          password: testPassword
        }
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/auth/customer/register', () => {
    it('should successfully register a new customer', async () => {
      const newEmail = generateTestEmail('register');

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/register',
        body: {
          email: newEmail,
          password: 'SecurePassword123',
          companyName: 'New Test Company',
          ico: '11112222',
          dic: 'SK2011112222',
          phone: '+421900111222',
          street: 'Test Street 1',
          city: 'Bratislava',
          zip: '81101',
          country: 'SK'
        }
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(newEmail.toLowerCase());
      expect(data.user.companyName).toBe('New Test Company');
    });

    it('should return 400 for missing required fields', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/register',
        body: {
          email: 'incomplete@test.example.com',
          password: 'password'
          // missing companyName, ico, dic
        }
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('povinné');
    });

    it('should return 400 for invalid email format', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/register',
        body: {
          email: 'invalid-email',
          password: 'SecurePassword123',
          companyName: 'Test Company',
          ico: '11112222',
          dic: 'SK2011112222'
        }
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('email');
    });

    it('should return 400 for password too short', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/register',
        body: {
          email: generateTestEmail('shortpwd'),
          password: '12345', // too short
          companyName: 'Test Company',
          ico: '11112222',
          dic: 'SK2011112222'
        }
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('6');
    });

    it('should return 409 for duplicate email', async () => {
      const existingEmail = generateTestEmail('duplicate');

      // First create a user
      await createTestCustomer(prisma, { email: existingEmail });

      // Try to register with same email
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/register',
        body: {
          email: existingEmail,
          password: 'SecurePassword123',
          companyName: 'Another Company',
          ico: '99998888',
          dic: 'SK2099998888'
        }
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('registrovaný');
    });

    it('should store optional fields correctly', async () => {
      const newEmail = generateTestEmail('optional');

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/auth/customer/register',
        body: {
          email: newEmail,
          password: 'SecurePassword123',
          companyName: 'Test Company With All Fields',
          ico: '33334444',
          dic: 'SK2033334444',
          vatId: 'SK2033334444',
          phone: '+421900333444',
          street: 'Main Street 42',
          city: 'Košice',
          zip: '04001',
          country: 'SK'
        }
      });

      const response = await registerHandler(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.phone).toBe('+421900333444');
      expect(data.user.city).toBe('Košice');
      expect(data.user.country).toBe('SK');
    });
  });
});
