import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as productService from '../../../src/modules/products/products.service.js';
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  createStockMovementSchema,
} from '../../../src/modules/products/products.schema.js';
import { authenticateJwt } from '../../../src/middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const app = new Hono().basePath('/products');

app.use('*', cors());

function checkAuth(c: any, allowedRoles?: Role[]) {
  const authHeader = c.req.header('Authorization');
  const dummyReq: any = { headers: { authorization: authHeader } };
  let authUser: any = null;

  authenticateJwt(dummyReq, {} as any, () => {
    authUser = dummyReq.user;
  });

  if (!authUser) {
    throw { statusCode: 401, message: 'Authentication required' };
  }

  if (allowedRoles && !allowedRoles.includes(authUser.role)) {
    throw {
      statusCode: 403,
      message: `Access denied: requires one of the following roles: ${allowedRoles.join(', ')}`,
    };
  }

  return authUser;
}

// GET /products
app.get('/', async (c) => {
  try {
    checkAuth(c);
    const query = productQuerySchema.parse(c.req.query());
    const result = await productService.listProducts(query as any);
    return c.json({ success: true, data: result }, 200);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message } }, status);
  }
});

// GET /products/:id
app.get('/:id', async (c) => {
  try {
    checkAuth(c);
    const id = c.req.param('id');
    const product = await productService.getProductById(id);
    return c.json({ success: true, data: { product } }, 200);
  } catch (err: any) {
    const status = err.statusCode || 404;
    return c.json({ success: false, error: { message: err.message } }, status);
  }
});

// POST /products (Admin, Warehouse)
app.post('/', async (c) => {
  try {
    const user = checkAuth(c, [Role.ADMIN, Role.WAREHOUSE]);
    const body = await c.req.json();
    const validated = createProductSchema.parse(body);
    const product = await productService.createProduct(validated, user.id);
    return c.json({ success: true, data: { product } }, 201);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message, details: err.details } }, status);
  }
});

// PUT /products/:id (Admin, Warehouse)
app.put('/:id', async (c) => {
  try {
    checkAuth(c, [Role.ADMIN, Role.WAREHOUSE]);
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = updateProductSchema.parse(body);
    const product = await productService.updateProduct(id, validated);
    return c.json({ success: true, data: { product } }, 200);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message, details: err.details } }, status);
  }
});

// POST /products/:id/stock-movements (Admin, Warehouse)
app.post('/:id/stock-movements', async (c) => {
  try {
    const user = checkAuth(c, [Role.ADMIN, Role.WAREHOUSE]);
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = createStockMovementSchema.parse(body);
    const result = await productService.recordStockMovement(id, validated, user.id);
    return c.json({ success: true, data: result }, 200);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message } }, status);
  }
});

// GET /products/:id/stock-movements
app.get('/:id/stock-movements', async (c) => {
  try {
    checkAuth(c);
    const id = c.req.param('id');
    const result = await productService.getStockMovements(id);
    return c.json({ success: true, data: result }, 200);
  } catch (err: any) {
    const status = err.statusCode || 404;
    return c.json({ success: false, error: { message: err.message } }, status);
  }
});

export default app;
