import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as customerService from '../../../src/modules/customers/customers.service.js';
import {
  customerQuerySchema,
  createCustomerSchema,
  updateCustomerSchema,
  addNoteSchema,
} from '../../../src/modules/customers/customers.schema.js';
import { authenticateJwt, requireRole } from '../../../src/middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const app = new Hono().basePath('/customers');

app.use('*', cors());

// Helper for JWT authentication & role check
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

// GET /customers
app.get('/', async (c) => {
  try {
    checkAuth(c);
    const query = customerQuerySchema.parse(c.req.query());
    const result = await customerService.listCustomers(query as any);
    return c.json({ success: true, data: result }, 200);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message, details: err.details } }, status);
  }
});

// GET /customers/:id
app.get('/:id', async (c) => {
  try {
    checkAuth(c);
    const id = c.req.param('id');
    const customer = await customerService.getCustomerById(id);
    return c.json({ success: true, data: { customer } }, 200);
  } catch (err: any) {
    const status = err.statusCode || 404;
    return c.json({ success: false, error: { message: err.message } }, status);
  }
});

// POST /customers (Admin, Sales)
app.post('/', async (c) => {
  try {
    checkAuth(c, [Role.ADMIN, Role.SALES]);
    const body = await c.req.json();
    const validated = createCustomerSchema.parse(body);
    const customer = await customerService.createCustomer(validated);
    return c.json({ success: true, data: { customer } }, 201);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message, details: err.details } }, status);
  }
});

// PUT /customers/:id (Admin, Sales)
app.put('/:id', async (c) => {
  try {
    checkAuth(c, [Role.ADMIN, Role.SALES]);
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = updateCustomerSchema.parse(body);
    const customer = await customerService.updateCustomer(id, validated);
    return c.json({ success: true, data: { customer } }, 200);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message, details: err.details } }, status);
  }
});

// POST /customers/:id/notes (Admin, Sales)
app.post('/:id/notes', async (c) => {
  try {
    checkAuth(c, [Role.ADMIN, Role.SALES]);
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = addNoteSchema.parse(body);
    const note = await customerService.addFollowUpNote(id, validated);
    return c.json({ success: true, data: { note } }, 201);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message } }, status);
  }
});

export default app;
