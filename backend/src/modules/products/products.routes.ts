import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  listProductsHandler,
  getProductByIdHandler,
  createProductHandler,
  updateProductHandler,
  createStockMovementHandler,
  getStockMovementsHandler,
} from './products.controller.js';
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  createStockMovementSchema,
} from './products.schema.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { authenticateJwt, requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

// Apply authentication to all product routes
router.use(authenticateJwt);

// GET /api/v1/products
router.get('/', validateRequest({ query: productQuerySchema }), listProductsHandler);

// GET /api/v1/products/:id
router.get('/:id', getProductByIdHandler);

// POST /api/v1/products (Admin, Warehouse)
router.post(
  '/',
  requireRole([Role.ADMIN, Role.WAREHOUSE]),
  validateRequest({ body: createProductSchema }),
  createProductHandler
);

// PUT /api/v1/products/:id (Admin, Warehouse)
router.put(
  '/:id',
  requireRole([Role.ADMIN, Role.WAREHOUSE]),
  validateRequest({ body: updateProductSchema }),
  updateProductHandler
);

// POST /api/v1/products/:id/stock-movements (Admin, Warehouse)
router.post(
  '/:id/stock-movements',
  requireRole([Role.ADMIN, Role.WAREHOUSE]),
  validateRequest({ body: createStockMovementSchema }),
  createStockMovementHandler
);

// GET /api/v1/products/:id/stock-movements
router.get('/:id/stock-movements', getStockMovementsHandler);

export const productsRouter = router;
