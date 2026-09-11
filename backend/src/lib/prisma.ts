import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, CustomerType, CustomerStatus, StockMovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | any;
};

// In-Memory Prisma Fallback Store for Testing / Offline Dev
function createInMemoryPrisma(): any {
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  const users: any[] = [
    { id: 'user-admin-id', name: 'Admin User', email: 'admin@ops.com', passwordHash, role: Role.ADMIN, createdAt: new Date() },
    { id: 'user-sales-id', name: 'Sales User', email: 'sales@ops.com', passwordHash, role: Role.SALES, createdAt: new Date() },
    { id: 'user-wh-id', name: 'Warehouse User', email: 'warehouse@ops.com', passwordHash, role: Role.WAREHOUSE, createdAt: new Date() },
    { id: 'user-acc-id', name: 'Accounts User', email: 'accounts@ops.com', passwordHash, role: Role.ACCOUNTS, createdAt: new Date() },
  ];

  const customers: any[] = [];
  const followUpNotes: any[] = [];
  const products: any[] = [];
  const stockMovements: any[] = [];
  const salesChallans: any[] = [];
  const challanItems: any[] = [];

  let lockPromise = Promise.resolve();

  const store = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id) return users.find((u) => u.id === where.id) || null;
        if (where.email) return users.find((u) => u.email === where.email) || null;
        return null;
      },
      findFirst: async ({ where }: any) => {
        if (where?.email) return users.find((u) => u.email === where.email) || null;
        return users[0] || null;
      },
    },
    customer: {
      findMany: async ({ where, skip = 0, take = 20 }: any = {}) => {
        let list = [...customers];
        if (where?.status) list = list.filter((c) => c.status === where.status);
        if (where?.customerType) list = list.filter((c) => c.customerType === where.customerType);
        if (where?.OR) {
          list = list.filter((c) =>
            where.OR.some(
              (cond: any) =>
                (cond.name?.contains && c.name.toLowerCase().includes(cond.name.contains.toLowerCase())) ||
                (cond.mobile?.contains && c.mobile.includes(cond.mobile.contains)) ||
                (cond.businessName?.contains && c.businessName?.toLowerCase().includes(cond.businessName.contains.toLowerCase()))
            )
          );
        }
        return list.slice(skip, skip + take).map((c) => ({
          ...c,
          _count: { notes: followUpNotes.filter((n) => n.customerId === c.id).length },
        }));
      },
      count: async ({ where }: any = {}) => {
        let list = [...customers];
        if (where?.status) list = list.filter((c) => c.status === where.status);
        return list.length;
      },
      findUnique: async ({ where, include }: any) => {
        const c = customers.find((cust) => cust.id === where.id);
        if (!c) return null;
        const res = { ...c };
        if (include?.notes) {
          res.notes = followUpNotes.filter((n) => n.customerId === c.id);
        }
        return res;
      },
      create: async ({ data }: any) => {
        const newCust = {
          id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: data.name,
          mobile: data.mobile,
          email: data.email || null,
          businessName: data.businessName || null,
          gstNumber: data.gstNumber || null,
          customerType: data.customerType,
          address: data.address || null,
          status: data.status || CustomerStatus.LEAD,
          followUpDate: data.followUpDate || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        customers.push(newCust);
        return newCust;
      },
      update: async ({ where, data }: any) => {
        const idx = customers.findIndex((c) => c.id === where.id);
        if (idx === -1) throw new Error('Customer not found');
        customers[idx] = { ...customers[idx], ...data, updatedAt: new Date() };
        return customers[idx];
      },
    },
    followUpNote: {
      create: async ({ data }: any) => {
        const note = {
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          customerId: data.customerId,
          note: data.note,
          createdAt: new Date(),
        };
        followUpNotes.push(note);
        return note;
      },
    },
    product: {
      findMany: async ({ where, skip = 0, take = 20 }: any = {}) => {
        let list = [...products];
        if (where?.category) list = list.filter((p) => p.category === where.category);
        if (where?.currentStock?.lte !== undefined) {
          list = list.filter((p) => p.currentStock <= p.minStock);
        }
        if (where?.OR) {
          list = list.filter((p) =>
            where.OR.some(
              (cond: any) =>
                (cond.name?.contains && p.name.toLowerCase().includes(cond.name.contains.toLowerCase())) ||
                (cond.sku?.contains && p.sku.toLowerCase().includes(cond.sku.contains.toLowerCase()))
            )
          );
        }
        return list.slice(skip, skip + take);
      },
      count: async () => products.length,
      findUnique: async ({ where }: any) => {
        if (where.id) return products.find((p) => p.id === where.id) || null;
        if (where.sku) return products.find((p) => p.sku === where.sku) || null;
        return null;
      },
      create: async ({ data }: any) => {
        const p = {
          id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: data.name,
          sku: data.sku,
          category: data.category || null,
          unitPrice: data.unitPrice,
          currentStock: data.currentStock ?? 0,
          minStock: data.minStock ?? 0,
          location: data.location || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        products.push(p);
        return p;
      },
      update: async ({ where, data }: any) => {
        const idx = products.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error('Product not found');
        const p = products[idx];
        let newStock = p.currentStock;
        if (data.currentStock) {
          if (data.currentStock.increment !== undefined) newStock += data.currentStock.increment;
          else if (data.currentStock.decrement !== undefined) newStock -= data.currentStock.decrement;
          else if (typeof data.currentStock === 'number') newStock = data.currentStock;
        }
        const updated = {
          ...p,
          ...data,
          currentStock: newStock,
          updatedAt: new Date(),
        };
        products[idx] = updated;
        return updated;
      },
    },
    stockMovement: {
      create: async ({ data }: any) => {
        const user = users.find((u) => u.id === data.createdById) || users[0];
        const sm = {
          id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          productId: data.productId,
          quantity: data.quantity,
          type: data.type,
          reason: data.reason,
          createdById: data.createdById,
          createdBy: user,
          createdAt: new Date(),
        };
        stockMovements.push(sm);
        return sm;
      },
      findMany: async ({ where }: any = {}) => {
        let list = [...stockMovements];
        if (where?.productId) list = list.filter((sm) => sm.productId === where.productId);
        return list.map((sm) => ({
          ...sm,
          createdBy: users.find((u) => u.id === sm.createdById) || users[0],
        }));
      },
    },
    salesChallan: {
      findFirst: async ({ where, orderBy }: any = {}) => {
        let list = [...salesChallans];
        if (where?.challanNumber?.startsWith) {
          list = list.filter((ch) => ch.challanNumber.startsWith(where.challanNumber.startsWith));
        }
        if (orderBy?.challanNumber === 'desc') {
          list.sort((a, b) => b.challanNumber.localeCompare(a.challanNumber));
        }
        return list[0] || null;
      },
      findMany: async ({ where, skip = 0, take = 20 }: any = {}) => {
        let list = [...salesChallans];
        if (where?.status) list = list.filter((ch) => ch.status === where.status);
        if (where?.customerId) list = list.filter((ch) => ch.customerId === where.customerId);
        return list.slice(skip, skip + take).map((ch) => ({
          ...ch,
          customer: customers.find((c) => c.id === ch.customerId) || null,
          createdBy: users.find((u) => u.id === ch.createdById) || null,
          _count: { items: challanItems.filter((ci) => ci.challanId === ch.id).length },
        }));
      },
      count: async ({ where }: any = {}) => {
        let list = [...salesChallans];
        if (where?.status) list = list.filter((ch) => ch.status === where.status);
        return list.length;
      },
      findUnique: async ({ where, include }: any) => {
        const ch = salesChallans.find((c) => c.id === where.id);
        if (!ch) return null;
        const res = {
          ...ch,
          customer: customers.find((c) => c.id === ch.customerId) || null,
          createdBy: users.find((u) => u.id === ch.createdById) || null,
        };
        if (include?.items) {
          res.items = challanItems
            .filter((ci) => ci.challanId === ch.id)
            .map((ci) => ({
              ...ci,
              product: products.find((p) => p.id === ci.productId) || null,
            }));
        }
        return res;
      },
      create: async ({ data, include }: any) => {
        const chId = `ch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const newCh = {
          id: chId,
          challanNumber: data.challanNumber,
          customerId: data.customerId,
          totalQuantity: data.totalQuantity,
          status: data.status || ChallanStatus.DRAFT,
          createdById: data.createdById,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        salesChallans.push(newCh);

        if (data.items?.createMany?.data) {
          for (const item of data.items.createMany.data) {
            challanItems.push({
              id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              challanId: chId,
              productId: item.productId,
              productNameSnap: item.productNameSnap,
              skuSnap: item.skuSnap,
              unitPriceSnap: item.unitPriceSnap,
              quantity: item.quantity,
            });
          }
        }

        const res = { ...newCh };
        if (include?.customer) res.customer = customers.find((c) => c.id === data.customerId) || null;
        if (include?.items) res.items = challanItems.filter((ci) => ci.challanId === chId);
        return res;
      },
      update: async ({ where, data, include }: any) => {
        const idx = salesChallans.findIndex((ch) => ch.id === where.id);
        if (idx === -1) throw new Error('Sales Challan not found');
        salesChallans[idx] = { ...salesChallans[idx], ...data, updatedAt: new Date() };
        const res = { ...salesChallans[idx] };
        if (include?.customer) res.customer = customers.find((c) => c.id === res.customerId) || null;
        if (include?.items) res.items = challanItems.filter((ci) => ci.challanId === res.id);
        return res;
      },
    },
    challanItem: {
      createMany: async ({ data }: any) => {
        for (const item of data) {
          challanItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            ...item,
          });
        }
        return { count: data.length };
      },
      deleteMany: async ({ where }: any) => {
        const initial = challanItems.length;
        for (let i = challanItems.length - 1; i >= 0; i--) {
          if (challanItems[i].challanId === where.challanId) {
            challanItems.splice(i, 1);
          }
        }
        return { count: initial - challanItems.length };
      },
    },
    $transaction: async (fn: any) => {
      // Execute transactions under a sequential mutex lock to guarantee atomic concurrency behavior
      let release: any;
      const nextLock = new Promise((resolve) => {
        release = resolve;
      });
      const currentLock = lockPromise;
      lockPromise = nextLock;

      await currentLock;
      try {
        return await fn(store);
      } finally {
        release();
      }
    },
    $queryRaw: async () => [{ '?column?': 1 }],
  };

  return store;
}

const createPrismaClient = () => {
  if (
    env.DATABASE_URL &&
    env.DATABASE_URL.startsWith('postgres') &&
    !env.DATABASE_URL.includes('placeholder')
  ) {
    try {
      const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
      const adapter = new PrismaPg(pool);
      return new PrismaClient({ adapter });
    } catch (_e) {
      return new PrismaClient();
    }
  }
  return createInMemoryPrisma();
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
