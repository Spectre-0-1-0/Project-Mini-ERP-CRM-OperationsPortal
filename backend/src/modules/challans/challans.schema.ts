import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

export const challanQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  status: z.nativeEnum(ChallanStatus).optional(),
  customerId: z.string().uuid('Invalid customer ID format').optional(),
});

export const challanItemInputSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export const createChallanSchema = z.object({
  customerId: z.string().min(1, 'customerId is required'),
  items: z
    .array(challanItemInputSchema)
    .min(1, 'Challan must contain at least one line item'),
});

export const updateChallanSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(challanItemInputSchema).min(1).optional(),
});

export type ChallanQueryInput = z.infer<typeof challanQuerySchema>;
export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
