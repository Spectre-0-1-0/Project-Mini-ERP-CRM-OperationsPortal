import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { customersRouter } from './modules/customers/customers.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { challansRouter } from './modules/challans/challans.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

// Health Check Endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'Server healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server unhealthy: Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API v1 Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/challans', challansRouter);

// Central 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found' },
  });
});

// Central Error Handling Middleware
app.use(errorHandler);
