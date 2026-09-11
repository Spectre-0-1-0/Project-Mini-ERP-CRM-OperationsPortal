import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import {
  CustomerQueryInput,
  CreateCustomerInput,
  UpdateCustomerInput,
  AddNoteInput,
} from './customers.schema.js';

export const listCustomers = async (query: CustomerQueryInput) => {
  const { page = 1, limit = 20, search, status, type } = query;

  const where: Prisma.CustomerWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (type) {
    where.customerType = type;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { mobile: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { businessName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { notes: true, challans: true },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCustomerById = async (id: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      notes: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { challans: true },
      },
    },
  });

  if (!customer) {
    throw new AppError(404, `Customer with ID '${id}' not found`);
  }

  return customer;
};

export const createCustomer = async (data: CreateCustomerInput) => {
  return await prisma.customer.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      email: data.email ?? null,
      businessName: data.businessName ?? null,
      gstNumber: data.gstNumber ?? null,
      customerType: data.customerType,
      address: data.address ?? null,
      status: data.status,
      followUpDate: data.followUpDate ?? null,
    },
  });
};

export const updateCustomer = async (id: string, data: UpdateCustomerInput) => {
  const existing = await prisma.customer.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError(404, `Customer with ID '${id}' not found`);
  }

  return await prisma.customer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.mobile !== undefined && { mobile: data.mobile }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.businessName !== undefined && { businessName: data.businessName }),
      ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber }),
      ...(data.customerType !== undefined && { customerType: data.customerType }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.followUpDate !== undefined && { followUpDate: data.followUpDate }),
    },
  });
};

export const addFollowUpNote = async (customerId: string, input: AddNoteInput) => {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });

  if (!customer) {
    throw new AppError(404, `Customer with ID '${customerId}' not found`);
  }

  return await prisma.followUpNote.create({
    data: {
      customerId,
      note: input.note,
    },
  });
};
