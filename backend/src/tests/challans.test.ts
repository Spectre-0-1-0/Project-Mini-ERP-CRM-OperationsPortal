import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Sales Challan Module & Concurrency Tests', () => {
  let salesToken: string;
  let warehouseToken: string;
  let accountsToken: string;
  let customerId: string;
  let productId: string;
  let challanId: string;

  beforeAll(async () => {
    // Login as Sales, Warehouse, and Accounts
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

    // Create test customer
    const custRes = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        name: `Challan Test Customer ${Date.now()}`,
        mobile: '9988776655',
        customerType: 'WHOLESALE',
      });
    customerId = custRes.body.data.customer.id;

    // Create test product with stock = 100
    const prodRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        name: `Challan Test Product ${Date.now()}`,
        sku: `CHPROD-${Date.now()}`,
        unitPrice: 250.00,
        initialStock: 100,
      });
    productId = prodRes.body.data.product.id;
  });

  it('POST /api/v1/challans - creates DRAFT sales challan with snapshotting', async () => {
    const res = await request(app)
      .post('/api/v1/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customerId,
        items: [{ productId, quantity: 10 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.challan.status).toBe('DRAFT');
    expect(res.body.data.challan.challanNumber).toMatch(/^CH-\d{4}-\d{4}$/);
    challanId = res.body.data.challan.id;
  });

  it('POST /api/v1/challans/:id/confirm - confirms draft challan and atomically decrements stock', async () => {
    const res = await request(app)
      .post(`/api/v1/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.challan.status).toBe('CONFIRMED');

    // Verify stock dropped from 100 to 90
    const prodRes = await request(app)
      .get(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(prodRes.body.data.product.currentStock).toBe(90);
  });

  it('POST /api/v1/challans/:id/cancel - cancels confirmed challan and reverses stock', async () => {
    const res = await request(app)
      .post(`/api/v1/challans/${challanId}/cancel`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.challan.status).toBe('CANCELLED');

    // Verify stock restored to 100
    const prodRes = await request(app)
      .get(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(prodRes.body.data.product.currentStock).toBe(100);
  });

  // Dedicated Concurrency Test 1: Concurrent challan-number generation
  it('CONCURRENCY TEST 1: Fire 10 simultaneous POST /challans requests and assert all challanNumber values are unique', async () => {
    const promises = Array.from({ length: 10 }).map(() =>
      request(app)
        .post('/api/v1/challans')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          customerId,
          items: [{ productId, quantity: 1 }],
        })
    );

    const responses = await Promise.all(promises);

    const challanNumbers = responses.map((res) => {
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      return res.body.data.challan.challanNumber;
    });

    const uniqueNumbers = new Set(challanNumbers);
    expect(uniqueNumbers.size).toBe(10);
  });

  // Dedicated Concurrency Test 2: Concurrent challan confirm against low stock
  it('CONCURRENCY TEST 2: Two simultaneous confirms against stock = 10 -> exactly one 200, one 409, final stock 0', async () => {
    // 1. Create low-stock product with stock = 10
    const lowStockProdRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        name: 'Low Stock Test Product',
        sku: `LOWSTOCK-${Date.now()}`,
        unitPrice: 50.00,
        initialStock: 10,
      });
    const lowStockProdId = lowStockProdRes.body.data.product.id;

    // 2. Create two DRAFT challans, each requesting 10 items
    const ch1Res = await request(app)
      .post('/api/v1/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ customerId, items: [{ productId: lowStockProdId, quantity: 10 }] });
    const ch1Id = ch1Res.body.data.challan.id;

    const ch2Res = await request(app)
      .post('/api/v1/challans')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ customerId, items: [{ productId: lowStockProdId, quantity: 10 }] });
    const ch2Id = ch2Res.body.data.challan.id;

    // 3. Fire both confirms simultaneously
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/v1/challans/${ch1Id}/confirm`)
        .set('Authorization', `Bearer ${salesToken}`),
      request(app)
        .post(`/api/v1/challans/${ch2Id}/confirm`)
        .set('Authorization', `Bearer ${salesToken}`),
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    // 4. Verify final stock is exactly 0 (never negative, not double-decremented)
    const checkProdRes = await request(app)
      .get(`/api/v1/products/${lowStockProdId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(checkProdRes.body.data.product.currentStock).toBe(0);
  });

  it('POST /api/v1/challans/:id/confirm - ACCOUNTS role confirm attempt returns 403 Forbidden', async () => {
    const res = await request(app)
      .post(`/api/v1/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${accountsToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
