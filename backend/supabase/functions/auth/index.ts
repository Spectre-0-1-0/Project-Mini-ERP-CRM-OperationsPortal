import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loginUser, getUserById } from '../../../src/modules/auth/auth.service.js';
import { loginSchema } from '../../../src/modules/auth/auth.schema.js';
import { authenticateJwt } from '../../../src/middleware/auth.middleware.js';

const app = new Hono().basePath('/auth');

app.use('*', cors());

// POST /auth/login
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const validated = loginSchema.parse(body);
    const result = await loginUser(validated);
    return c.json({ success: true, data: result }, 200);
  } catch (err: any) {
    const status = err.statusCode || 400;
    return c.json({ success: false, error: { message: err.message, details: err.details } }, status);
  }
});

// GET /auth/me
app.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const dummyReq: any = { headers: { authorization: authHeader } };
    let authenticatedUser: any = null;

    authenticateJwt(dummyReq, {} as any, () => {
      authenticatedUser = dummyReq.user;
    });

    if (!authenticatedUser) {
      return c.json({ success: false, error: { message: 'Unauthorized' } }, 401);
    }

    const user = await getUserById(authenticatedUser.id);
    return c.json({ success: true, data: { user } }, 200);
  } catch (err: any) {
    const status = err.statusCode || 401;
    return c.json({ success: false, error: { message: err.message } }, status);
  }
});

export default app;
