import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

export const productQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  lowStock: z.string().optional().transform((val) => val === 'true'),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().trim().min(2, 'SKU must be at least 2 characters'),
  category: z.string().trim().optional().nullable(),
  unitPrice: z.number().positive('Unit price must be a positive number'),
  initialStock: z.number().int().min(0, 'Initial stock cannot be negative').default(0),
  minStock: z.number().int().min(0, 'Minimum stock cannot be negative').default(0),
  location: z.string().trim().optional().nullable(),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(2).optional(),
  sku: z.string().trim().min(2).optional(),
  category: z.string().trim().optional().nullable(),
  unitPrice: z.number().positive().optional(),
  minStock: z.number().int().min(0).optional(),
  location: z.string().trim().optional().nullable(),
});

export const createStockMovementSchema = z.object({
  quantity: z.number().int().positive('Movement quantity must be a positive integer'),
  type: z.nativeEnum(StockMovementType, {
    errorMap: () => ({ message: 'Movement type must be IN or OUT' }),
  }),
  reason: z.string().trim().min(2, 'Reason is required and must be at least 2 characters'),
});

export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
