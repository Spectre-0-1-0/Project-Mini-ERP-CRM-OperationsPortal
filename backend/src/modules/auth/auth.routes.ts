import { Router } from 'express';
import { loginHandler, getMeHandler } from './auth.controller.js';
import { loginSchema } from './auth.schema.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticateJwt } from '../../middleware/auth.middleware.js';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', validateRequest({ body: loginSchema }), loginHandler);

// GET /api/v1/auth/me
router.get('/me', authenticateJwt, getMeHandler);

export const authRouter = router;
