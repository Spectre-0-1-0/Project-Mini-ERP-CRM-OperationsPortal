import http from 'http';
import jwt from 'jsonwebtoken';
import { Role, StockMovementType, ChallanStatus } from '@prisma/client';
import { app } from '../../backend/src/app.js';
import { env } from '../../backend/src/config/env.js';
import { prisma } from '../../backend/src/lib/prisma.js';

function generateTestToken(role: Role, userId: string = 'user-admin-1') {
  return jwt.sign(
    { id: userId, email: `${role.toLowerCase()}@ops.com`, name: `${role} User`, role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function runE2EFullFlowVerification() {
  console.log('🧪 Starting End-to-End Business Flow Verification...\n');
  console.log('Flow: Add Customer -> Add Product with Stock -> Create Draft Challan -> Confirm Challan -> Verify Stock Decrement & Movement Log\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5096, resolve));
  const baseUrl = 'http://localhost:5096/api/v1';

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  const adminUserId = 'user-admin-101';
  const adminToken = generateTestToken(Role.ADMIN, adminUserId);

  // In-memory mock database state for isolated end-to-end execution
  const db = {
    customers: new Map<string, any>(),
    products: new Map<string, any>(),
    challans: new Map<string, any>(),
    movements: [] as any[],
  };

  prisma.user.findUnique = (async () => ({ id: adminUserId, name: 'System Admin', email: 'admin@ops.com', role: Role.ADMIN })) as any;

  prisma.customer.create = (async (args: any) => {
    const cust = { id: `cust-${db.customers.size + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
    db.customers.set(cust.id, cust);
    return cust;
  }) as any;

  prisma.customer.findUnique = (async (args: any) => db.customers.get(args.where.id) || null) as any;

  prisma.product.findUnique = (async (args: any) => {
    if (args.where.sku) {
      for (const p of db.products.values()) {
        if (p.sku === args.where.sku) return p;
      }
      return null;
    }
    return db.products.get(args.where.id) || null;
  }) as any;

  prisma.stockMovement.create = (async (args: any) => {
    const move = {
      id: `move-${db.movements.length + 1}`,
      ...args.data,
      createdAt: new Date(),
      createdBy: { id: adminUserId, name: 'System Admin', email: 'admin@ops.com', role: Role.ADMIN },
    };
    db.movements.push(move);
    return move;
  }) as any;

  prisma.stockMovement.findMany = (async (args: any) => {
    return db.movements.filter((m) => m.productId === args.where.productId);
  }) as any;

  prisma.salesChallan.findFirst = (async () => null) as any;

  prisma.$transaction = (async (cb: any) => {
    const txMock = {
      customer: prisma.customer,
      product: {
        create: async (args: any) => {
          const prod = { id: `prod-${db.products.size + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
          db.products.set(prod.id, prod);
          return prod;
        },
        findUnique: prisma.product.findUnique,
        update: async (args: any) => {
          const existing = db.products.get(args.where.id);
          let newStock = existing.currentStock;
          if (args.data.currentStock?.decrement) newStock -= args.data.currentStock.decrement;
          else if (args.data.currentStock?.increment) newStock += args.data.currentStock.increment;
          else if (typeof args.data.currentStock === 'number') newStock = args.data.currentStock;

          const updated = { ...existing, currentStock: newStock, updatedAt: new Date() };
          db.products.set(args.where.id, updated);
          return updated;
        },
      },
      stockMovement: prisma.stockMovement,
      salesChallan: {
        create: async (args: any) => {
          const id = `ch-${db.challans.size + 1}`;
          const items = args.data.items.createMany.data.map((item: any, idx: number) => ({
            id: `item-${idx + 1}`,
            challanId: id,
            ...item,
          }));
          const challan = {
            id,
            challanNumber: 'CH-2026-0001',
            customerId: args.data.customerId,
            totalQuantity: args.data.totalQuantity,
            status: args.data.status,
            createdById: args.data.createdById,
            customer: db.customers.get(args.data.customerId),
            items,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          db.challans.set(id, challan);
          return challan;
        },
        findUnique: async (args: any) => db.challans.get(args.where.id) || null,
        update: async (args: any) => {
          const existing = db.challans.get(args.where.id);
          const updated = { ...existing, ...args.data };
          db.challans.set(args.where.id, updated);
          return updated;
        },
      },
    };
    return await cb(txMock);
  }) as any;

  try {
    // --------------------------------------------------------------------------
    // STEP 1: Add a Customer
    // --------------------------------------------------------------------------
    const custRes = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Global Wholesale Corp',
        mobile: '9898989898',
        email: 'info@globalcorp.com',
        customerType: 'WHOLESALE',
        status: 'ACTIVE',
      }),
    });
    const custJson = await custRes.json();
    const createdCustomerId = custJson.data?.customer?.id;

    assert(custRes.status === 201 && createdCustomerId !== undefined, 'STEP 1: Successfully added customer "Global Wholesale Corp"');

    // --------------------------------------------------------------------------
    // STEP 2: Add a Product with Stock (50 units)
    // --------------------------------------------------------------------------
    const prodRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Heavy Duty Pump 10HP',
        sku: 'PUMP-10HP-99',
        category: 'Machinery',
        unitPrice: 450.00,
        initialStock: 50,
        minStock: 10,
      }),
    });
    const prodJson = await prodRes.json();
    const createdProductId = prodJson.data?.product?.id;

    assert(
      prodRes.status === 201 && createdProductId !== undefined && prodJson.data.product.currentStock === 50,
      'STEP 2: Successfully added product "Heavy Duty Pump 10HP" with initial stock = 50 units'
    );

    // --------------------------------------------------------------------------
    // STEP 3: Create a Draft Sales Challan (10 units)
    // --------------------------------------------------------------------------
    const challanRes = await fetch(`${baseUrl}/challans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customerId: createdCustomerId,
        items: [{ productId: createdProductId, quantity: 10 }],
      }),
    });
    const challanJson = await challanRes.json();
    const createdChallanId = challanJson.data?.challan?.id;
    const challanNumber = challanJson.data?.challan?.challanNumber;

    assert(
      challanRes.status === 201 &&
      createdChallanId !== undefined &&
      challanJson.data.challan.status === ChallanStatus.DRAFT &&
      db.products.get(createdProductId).currentStock === 50,
      `STEP 3: Successfully created DRAFT Sales Challan '${challanNumber}' (stock remains 50 while DRAFT)`
    );

    // --------------------------------------------------------------------------
    // STEP 4: Confirm the Sales Challan
    // --------------------------------------------------------------------------
    const confirmRes = await fetch(`${baseUrl}/challans/${createdChallanId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const confirmJson = await confirmRes.json();
    const updatedStock = db.products.get(createdProductId).currentStock;

    assert(
      confirmRes.status === 200 &&
      confirmJson.data?.challan?.status === ChallanStatus.CONFIRMED &&
      updatedStock === 40,
      `STEP 4: Successfully confirmed Challan '${challanNumber}'. Product stock dropped from 50 to 40 units.`
    );

    // --------------------------------------------------------------------------
    // STEP 5: Verify Product Stock Movement Audit Log
    // --------------------------------------------------------------------------
    const historyRes = await fetch(`${baseUrl}/products/${createdProductId}/stock-movements`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const historyJson = await historyRes.json();
    const movements = historyJson.data?.movements || [];

    const hasInitialLoad = movements.some((m: any) => m.type === StockMovementType.IN && m.quantity === 50);
    const hasChallanConfirm = movements.some(
      (m: any) => m.type === StockMovementType.OUT && m.quantity === 10 && m.reason.includes(challanNumber)
    );

    assert(
      historyRes.status === 200 && movements.length === 2 && hasInitialLoad && hasChallanConfirm,
      `STEP 5: Stock movement log correctly records initial load (IN +50) and challan confirmation (OUT -10 for ${challanNumber})`
    );

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log(`\n============================================================`);
  console.log(`  E2E FULL FLOW VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED  `);
  console.log(`============================================================\n`);

  if (failed > 0) process.exit(1);
}

runE2EFullFlowVerification();
