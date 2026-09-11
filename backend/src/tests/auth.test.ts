import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Auth Module API Tests', () => {
  let adminToken: string;

  it('POST /api/v1/auth/login - valid credentials returns JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ops.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@ops.com');
    expect(res.body.data.user.role).toBe('ADMIN');

    adminToken = res.body.data.token;
  });

  it('POST /api/v1/auth/login - invalid password returns 401 generic message', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@ops.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('POST /api/v1/auth/login - malformed email returns 400 validation error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details).toBeDefined();
  });

  it('GET /api/v1/auth/me - valid token returns current user profile', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'sales@ops.com', password: 'Password123!' });

    const salesToken = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('SALES');
  });

  it('GET /api/v1/auth/me - missing token returns 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me - tampered token returns 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.tampered.token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
