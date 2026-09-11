import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listChallansHandler,
  getChallanByIdHandler,
  createChallanHandler,
  updateChallanHandler,
  confirmChallanHandler,
  cancelChallanHandler,
} from './challans.controller.js';
import {
  challanQuerySchema,
  createChallanSchema,
  updateChallanSchema,
} from './challans.schema.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticateJwt, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Apply authentication to all challan routes
router.use(authenticateJwt);

// GET /api/v1/challans
router.get('/', validateRequest({ query: challanQuerySchema }), listChallansHandler);

// GET /api/v1/challans/:id
router.get('/:id', getChallanByIdHandler);

// POST /api/v1/challans (Admin, Sales)
router.post(
  '/',
  requireRole([Role.ADMIN, Role.SALES]),
  validateRequest({ body: createChallanSchema }),
  createChallanHandler
);

// PUT /api/v1/challans/:id (Admin, Sales)
router.put(
  '/:id',
  requireRole([Role.ADMIN, Role.SALES]),
  validateRequest({ body: updateChallanSchema }),
  updateChallanHandler
);

// POST /api/v1/challans/:id/confirm (Admin, Sales)
router.post(
  '/:id/confirm',
  requireRole([Role.ADMIN, Role.SALES]),
  confirmChallanHandler
);

// POST /api/v1/challans/:id/cancel (Admin, Sales)
router.post(
  '/:id/cancel',
  requireRole([Role.ADMIN, Role.SALES]),
  cancelChallanHandler
);

export const challansRouter = router;
