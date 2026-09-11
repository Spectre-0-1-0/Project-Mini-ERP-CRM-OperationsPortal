import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Customers Module API Tests', () => {
  let adminToken: string;
  let warehouseToken: string;
  let createdCustomerId: string;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ops.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.token;

    const warehouseLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'warehouse@ops.com', password: 'Password123!' });
    warehouseToken = warehouseLogin.body.data.token;
  });

  it('GET /api/v1/customers - returns paginated customers list', async () => {
    const res = await request(app)
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('POST /api/v1/customers - ADMIN creates a customer successfully', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Acme Test Corp',
        mobile: '9876543210',
        email: 'contact@acmetest.com',
        customerType: 'WHOLESALE',
        status: 'LEAD',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customer.id).toBeDefined();
    createdCustomerId = res.body.data.customer.id;
  });

  it('POST /api/v1/customers - WAREHOUSE role creation attempt returns 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        name: 'Unauthorized Corp',
        mobile: '1234567890',
        customerType: 'RETAIL',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/customers - malformed input returns 400 validation error', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: '', // Empty name triggers validation failure
        mobile: 'invalid-phone',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/customers/:id - returns customer detail with notes', async () => {
    const res = await request(app)
      .get(`/api/v1/customers/${createdCustomerId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customer.name).toBe('Acme Test Corp');
  });

  it('GET /api/v1/customers/:id - non-existent ID returns 404', async () => {
    const res = await request(app)
      .get('/api/v1/customers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/customers/:id/notes - adds follow-up note', async () => {
    const res = await request(app)
      .post(`/api/v1/customers/${createdCustomerId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Initial call completed. Requested quote.' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.note.note).toBe('Initial call completed. Requested quote.');
  });
});
