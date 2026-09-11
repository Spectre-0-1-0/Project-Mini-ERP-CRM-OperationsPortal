import { ChallanStatus, StockMovementType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import {
  ChallanQueryInput,
  CreateChallanInput,
  UpdateChallanInput,
} from './challans.schema.js';

// Helper to generate atomic sequential challan number within transaction
const generateChallanNumber = async (tx: any): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const lastChallan = await tx.salesChallan.findFirst({
    where: {
      challanNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      challanNumber: 'desc',
    },
  });

  let sequence = 1;
  if (lastChallan && lastChallan.challanNumber) {
    const parts = lastChallan.challanNumber.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
  }

  const formattedSeq = sequence.toString().padStart(4, '0');
  return `${prefix}${formattedSeq}`;
};

export const listChallans = async (query: ChallanQueryInput) => {
  const { page = 1, limit = 20, status, customerId } = query;

  const where: any = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.salesChallan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, mobile: true, businessName: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { items: true },
        },
      },
    }),
    prisma.salesChallan.count({ where }),
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

export const getChallanById = async (id: string) => {
  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            select: { id: true, currentStock: true, minStock: true, location: true },
          },
        },
      },
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!challan) {
    throw new AppError(404, `Sales Challan with ID '${id}' not found`);
  }

  return challan;
};

export const createChallan = async (data: CreateChallanInput, userId: string) => {
  return await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      throw new AppError(404, `Customer with ID '${data.customerId}' not found`);
    }

    const itemSnapshots = [];
    let totalQuantity = 0;

    for (const item of data.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new AppError(404, `Product with ID '${item.productId}' not found`);
      }

      itemSnapshots.push({
        productId: product.id,
        productNameSnap: product.name,
        skuSnap: product.sku,
        unitPriceSnap: product.unitPrice,
        quantity: item.quantity,
      });

      totalQuantity += item.quantity;
    }

    const challanNumber = await generateChallanNumber(tx);

    const challan = await tx.salesChallan.create({
      data: {
        challanNumber,
        customerId: data.customerId,
        totalQuantity,
        status: ChallanStatus.DRAFT,
        createdById: userId,
        items: {
          createMany: {
            data: itemSnapshots,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
      },
    });

    return challan;
  });
};

export const updateChallan = async (id: string, data: UpdateChallanInput) => {
  const existing = await prisma.salesChallan.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, `Sales Challan with ID '${id}' not found`);
  }

  if (existing.status !== ChallanStatus.DRAFT) {
    throw new AppError(
      409,
      `Challan '${existing.challanNumber}' cannot be edited because its status is ${existing.status}. Only DRAFT challans can be modified.`
    );
  }

  return await prisma.$transaction(async (tx) => {
    if (data.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) {
        throw new AppError(404, `Customer with ID '${data.customerId}' not found`);
      }
    }

    let totalQuantity = existing.totalQuantity;

    if (data.items) {
      await tx.challanItem.deleteMany({ where: { challanId: id } });

      const itemSnapshots = [];
      totalQuantity = 0;

      for (const item of data.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new AppError(404, `Product with ID '${item.productId}' not found`);
        }

        itemSnapshots.push({
          challanId: id,
          productId: product.id,
          productNameSnap: product.name,
          skuSnap: product.sku,
          unitPriceSnap: product.unitPrice,
          quantity: item.quantity,
        });

        totalQuantity += item.quantity;
      }

      await tx.challanItem.createMany({
        data: itemSnapshots,
      });
    }

    const updated = await tx.salesChallan.update({
      where: { id },
      data: {
        ...(data.customerId && { customerId: data.customerId }),
        totalQuantity,
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
      },
    });

    return updated;
  });
};

export const confirmChallan = async (id: string, userId: string) => {
  return await prisma.$transaction(async (tx) => {
    const challan = await tx.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      throw new AppError(404, `Sales Challan with ID '${id}' not found`);
    }

    if (challan.status === ChallanStatus.CONFIRMED) {
      throw new AppError(409, `Challan '${challan.challanNumber}' is already CONFIRMED`);
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      throw new AppError(409, `Cannot confirm a CANCELLED challan ('${challan.challanNumber}')`);
    }

    // Check stock for ALL line items inside the transaction before modifying anything
    for (const item of challan.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw new AppError(404, `Product with ID '${item.productId}' not found`);
      }

      if (product.currentStock < item.quantity) {
        throw new AppError(
          409,
          `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available stock: ${product.currentStock}, requested: ${item.quantity}`
        );
      }
    }

    // Atomic Stock Decrement + StockMovement Creation
    for (const item of challan.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          currentStock: {
            decrement: item.quantity,
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: StockMovementType.OUT,
          reason: `Challan ${challan.challanNumber} confirmed`,
          createdById: userId,
        },
      });
    }

    const confirmedChallan = await tx.salesChallan.update({
      where: { id },
      data: { status: ChallanStatus.CONFIRMED },
      include: {
        customer: true,
        items: true,
      },
    });

    return confirmedChallan;
  });
};

export const cancelChallan = async (id: string, userId: string) => {
  return await prisma.$transaction(async (tx) => {
    const challan = await tx.salesChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      throw new AppError(404, `Sales Challan with ID '${id}' not found`);
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      throw new AppError(409, `Challan '${challan.challanNumber}' is already CANCELLED`);
    }

    // If the challan was CONFIRMED, reverse the stock decrement atomically
    if (challan.status === ChallanStatus.CONFIRMED) {
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              increment: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            type: StockMovementType.IN,
            reason: `Challan ${challan.challanNumber} cancelled`,
            createdById: userId,
          },
        });
      }
    }

    const cancelledChallan = await tx.salesChallan.update({
      where: { id },
      data: { status: ChallanStatus.CANCELLED },
      include: {
        customer: true,
        items: true,
      },
    });

    return cancelledChallan;
  });
};
