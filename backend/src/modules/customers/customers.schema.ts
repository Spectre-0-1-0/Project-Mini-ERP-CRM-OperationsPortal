import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const customerQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
  search: z.string().trim().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  type: z.nativeEnum(CustomerType).optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Customer name must be at least 2 characters'),
  mobile: z.string().trim().min(7, 'Mobile number must be at least 7 characters'),
  email: z.string().trim().email('Invalid email address').optional().nullable(),
  businessName: z.string().trim().optional().nullable(),
  gstNumber: z.string().trim().optional().nullable(),
  customerType: z.nativeEnum(CustomerType, {
    errorMap: () => ({ message: 'customerType must be RETAIL, WHOLESALE, or DISTRIBUTOR' }),
  }),
  address: z.string().trim().optional().nullable(),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.LEAD),
  followUpDate: z.string().datetime().optional().nullable().transform((val) => (val ? new Date(val) : null)),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const addNoteSchema = z.object({
  note: z.string().trim().min(1, 'Note content cannot be empty'),
});

export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
