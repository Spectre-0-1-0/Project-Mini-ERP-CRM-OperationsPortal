import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as challanService from '../../../src/modules/challans/challans.service.js';
import {
  challanQuerySchema,
  createChallanSchema,
  updateChallanSchema,
} from '../../../src/modules/challans/challans.schema.js';
import { authenticateJwt } from '../../../src/middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const app = new Hono().basePath('/challans');

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

// GET /challans
app.get('/', async (c) => {
  try {
    checkAuth(c);
    const query = challanQuerySchema.parse(c.req.query());
    const result = await challanService.listChallans(query as any);
    return c.json({ success: true, data: result }, 200);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message } }, status);
  }
});

// GET /challans/:id
app.get('/:id', async (c) => {
  try {
    checkAuth(c);
    const id = c.req.param('id');
    const challan = await challanService.getChallanById(id);
    return c.json({ success: true, data: { challan } }, 200);
  } catch (err: any) {
    const status = err.statusCode || 404;
    return c.json({ success: false, error: { message: err.message } }, status);
  }
});

// POST /challans (Admin, Sales)
app.post('/', async (c) => {
  try {
    const user = checkAuth(c, [Role.ADMIN, Role.SALES]);
    const body = await c.req.json();
    const validated = createChallanSchema.parse(body);
    const challan = await challanService.createChallan(validated, user.id);
    return c.json({ success: true, data: { challan } }, 201);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message, details: err.details } }, status);
  }
});

// PUT /challans/:id (Admin, Sales)
app.put('/:id', async (c) => {
  try {
    checkAuth(c, [Role.ADMIN, Role.SALES]);
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = updateChallanSchema.parse(body);
    const challan = await challanService.updateChallan(id, validated);
    return c.json({ success: true, data: { challan } }, 200);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message, details: err.details } }, status);
  }
});

// POST /challans/:id/confirm (Admin, Sales)
app.post('/:id/confirm', async (c) => {
  try {
    const user = checkAuth(c, [Role.ADMIN, Role.SALES]);
    const id = c.req.param('id');
    const challan = await challanService.confirmChallan(id, user.id);
    return c.json({ success: true, data: { challan } }, 200);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message } }, status);
  }
});

// POST /challans/:id/cancel (Admin, Sales)
app.post('/:id/cancel', async (c) => {
  try {
    const user = checkAuth(c, [Role.ADMIN, Role.SALES]);
    const id = c.req.param('id');
    const challan = await challanService.cancelChallan(id, user.id);
    return c.json({ success: true, data: { challan } }, 200);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message } }, status);
  }
});

export default app;
