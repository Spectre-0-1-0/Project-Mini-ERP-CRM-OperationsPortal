import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Products & Stock Module API Tests', () => {
  let warehouseToken: string;
  let salesToken: string;
  let createdProductId: string;

  beforeAll(async () => {
    const warehouseLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'warehouse@ops.com', password: 'Password123!' });
    warehouseToken = warehouseLogin.body.data.token;

    const salesLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sales@ops.com', password: 'Password123!' });
    salesToken = salesLogin.body.data.token;
  });

  it('GET /api/v1/products - returns product list', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${warehouseToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('POST /api/v1/products - WAREHOUSE role creates product successfully', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        name: 'Industrial Valve 2-Inch',
        sku: `VALVE-${Date.now()}`,
        category: 'Hardware',
        unitPrice: 150.00,
        currentStock: 0,
        minStock: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product.id).toBeDefined();
    createdProductId = res.body.data.product.id;
  });

  it('POST /api/v1/products - SALES role product creation attempt returns 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        name: 'Forbidden Product',
        sku: `FORBIDDEN-${Date.now()}`,
        unitPrice: 99.99,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/products/:id/stock-movements - record IN stock movement', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${createdProductId}/stock-movements`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        quantity: 50,
        type: 'IN',
        reason: 'Initial stock import from vendor',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.product.currentStock).toBe(50);
  });

  it('POST /api/v1/products/:id/stock-movements - excessive OUT movement returns 409 Conflict', async () => {
    const res = await request(app)
      .post(`/api/v1/products/${createdProductId}/stock-movements`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        quantity: 1000,
        type: 'OUT',
        reason: 'Excessive movement test',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/products/:id/stock-movements - returns audit trail history', async () => {
    const res = await request(app)
      .get(`/api/v1/products/${createdProductId}/stock-movements`)
      .set('Authorization', `Bearer ${warehouseToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.movements)).toBe(true);
    expect(res.body.data.movements.length).toBeGreaterThan(0);
  });
});
