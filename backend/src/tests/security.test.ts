import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Security Audit & Checklist Tests (06_TESTING_AND_SECURITY.md §3)', () => {
  let adminToken: string;
  let salesToken: string;
  let warehouseToken: string;
  let accountsToken: string;

  beforeAll(async () => {
    // Authenticate all 4 roles
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ops.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.token;

    const salesLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sales@ops.com', password: 'Password123!' });
    salesToken = salesLogin.body.data.token;

    const warehouseLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'warehouse@ops.com', password: 'Password123!' });
    warehouseToken = warehouseLogin.body.data.token;

    const accountsLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'accounts@ops.com', password: 'Password123!' });
    accountsToken = accountsLogin.body.data.token;
  });

  describe('1. Authentication Security', () => {
    it('Login with wrong password returns 401 with generic error message', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@ops.com', password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('Missing JWT on protected route returns 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Tampered JWT token signature is rejected with 401', async () => {
      const tamperedToken = adminToken.slice(0, -5) + 'XXXXX';
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Authorization & RBAC Role Bypass Matrix', () => {
    it('WAREHOUSE role attempting customer creation (POST /customers) returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ name: 'Role Bypass Test', mobile: '9998887776', customerType: 'RETAIL' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Access denied');
    });

    it('SALES role attempting product creation (POST /products) returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({ name: 'Role Bypass Prod', sku: 'BYPASS-SKU', unitPrice: 99.99 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('SALES role attempting manual stock movement (POST /products/:id/stock-movements) returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/products/some-product-id/stock-movements')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({ quantity: 50, type: 'IN', reason: 'Unauthorized movement' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('ACCOUNTS role attempting challan confirm (POST /challans/:id/confirm) returns 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/challans/some-challan-id/confirm')
        .set('Authorization', `Bearer ${accountsToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Injection & Input Fuzzing Security', () => {
    it('SQL Injection payload in search query is parameterized safely (no SQL error)', async () => {
      const sqlInjection = "' OR '1'='1'; DROP TABLE \"User\";--";
      const res = await request(app)
        .get(`/api/v1/customers?search=${encodeURIComponent(sqlInjection)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('XSS script payload in customer create is sanitized/stored as inert text', async () => {
      const xssPayload = "<script>alert('XSS-Test')</script>";
      const res = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: xssPayload,
          mobile: '9876500000',
          customerType: 'RETAIL',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer.name).toBe(xssPayload); // Stored as literal string without executing
    });

    it('Malformed JSON payload returns 400 Bad Request via Zod validation', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toBeDefined();
    });
  });
});
