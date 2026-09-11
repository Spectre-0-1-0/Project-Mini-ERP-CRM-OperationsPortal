import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listCustomersHandler,
  getCustomerByIdHandler,
  createCustomerHandler,
  updateCustomerHandler,
  addNoteHandler,
} from './customers.controller.js';
import {
  customerQuerySchema,
  createCustomerSchema,
  updateCustomerSchema,
  addNoteSchema,
} from './customers.schema.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticateJwt, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Apply authentication to all customer routes
router.use(authenticateJwt);

// GET /api/v1/customers
router.get('/', validateRequest({ query: customerQuerySchema }), listCustomersHandler);

// GET /api/v1/customers/:id
router.get('/:id', getCustomerByIdHandler);

// POST /api/v1/customers (Admin, Sales)
router.post(
  '/',
  requireRole([Role.ADMIN, Role.SALES]),
  validateRequest({ body: createCustomerSchema }),
  createCustomerHandler
);

// PUT /api/v1/customers/:id (Admin, Sales)
router.put(
  '/:id',
  requireRole([Role.ADMIN, Role.SALES]),
  validateRequest({ body: updateCustomerSchema }),
  updateCustomerHandler
);

// POST /api/v1/customers/:id/notes (Admin, Sales)
router.post(
  '/:id/notes',
  requireRole([Role.ADMIN, Role.SALES]),
  validateRequest({ body: addNoteSchema }),
  addNoteHandler
);

export const customersRouter = router;
