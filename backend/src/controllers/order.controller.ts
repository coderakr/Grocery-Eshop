import { z } from 'zod';
import type { Request, Response } from 'express';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  cartItems,
  orderItems,
  orders,
  orderStatusEnum,
  products,
  users,
} from '../db/schema.js';
import { ApiError, asyncHandler } from '../utils/http.js';
import { calculateShippingFee } from '../utils/pricing.js';

export const createOrderSchema = z.object({
  shippingName: z.string().min(2).max(120),
  shippingPhone: z.string().min(4).max(30),
  shippingAddress: z.string().min(5).max(500),
  note: z.string().max(1000).nullable().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatusEnum.enumValues),
});

const orderWithItems = {
  items: true,
  user: { columns: { id: true, name: true, email: true } },
} as const;

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const input = createOrderSchema.parse(req.body);
  const userId = req.user!.id;

  const cart = await db.query.cartItems.findMany({
    where: eq(cartItems.userId, userId),
    with: { product: true },
  });

  if (cart.length === 0) {
    throw ApiError.badRequest('Your cart is empty');
  }

  for (const item of cart) {
    if (!item.product.isActive) {
      throw ApiError.badRequest(`${item.product.name} is no longer available`);
    }
    if (item.quantity > item.product.stock) {
      throw ApiError.badRequest(
        `Only ${item.product.stock} item(s) of ${item.product.name} available`,
      );
    }
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const shippingFee = calculateShippingFee(subtotal);
  const total = subtotal + shippingFee;

  const [order] = await db
    .insert(orders)
    .values({
      userId,
      subtotal: subtotal.toFixed(2),
      shippingFee: shippingFee.toFixed(2),
      total: total.toFixed(2),
      status: 'pending',
      shippingName: input.shippingName,
      shippingPhone: input.shippingPhone,
      shippingAddress: input.shippingAddress,
      note: input.note ?? null,
    })
    .returning();

  if (!order) {
    throw new ApiError(500, 'Could not create order');
  }

  const statements = [
    db.insert(orderItems).values(
      cart.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.product.name,
        unitPrice: item.product.price,
        quantity: item.quantity,
      })),
    ),
    ...cart.map((item) =>
      db
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(eq(products.id, item.productId)),
    ),
    db.delete(cartItems).where(eq(cartItems.userId, userId)),
  ];

  await db.batch(
    statements as unknown as [typeof statements[number], ...typeof statements],
  );

  const created = await db.query.orders.findFirst({
    where: eq(orders.id, order.id),
    with: orderWithItems,
  });

  res.status(201).json({ success: true, data: created });
});

export const listMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const rows = await db.query.orders.findMany({
    where: eq(orders.userId, req.user!.id),
    orderBy: desc(orders.createdAt),
    with: { items: true },
  });
  res.json({ success: true, data: rows });
});

export const getMyOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.userId, req.user!.id)),
    with: orderWithItems,
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  res.json({ success: true, data: order });
});

export const listAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const where =
    status && orderStatusEnum.enumValues.includes(status as never)
      ? eq(orders.status, status as (typeof orderStatusEnum.enumValues)[number])
      : undefined;

  const rows = await db.query.orders.findMany({
    where,
    orderBy: desc(orders.createdAt),
    with: orderWithItems,
  });
  res.json({ success: true, data: rows });
});

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { status } = updateOrderStatusSchema.parse(req.body);

    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const updated = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: orderWithItems,
    });
    res.json({ success: true, data: updated });
  },
);

export const getDashboardStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const [revenueRow] = await db
      .select({
        revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .where(sql`${orders.status} <> 'cancelled'`);

    const [orderCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders);

    const [productCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products);

    const [userCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    const [pendingRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, 'pending'));

    const recentOrders = await db.query.orders.findMany({
      orderBy: desc(orders.createdAt),
      limit: 5,
      with: orderWithItems,
    });

    const lowStock = await db
      .select({
        id: products.id,
        name: products.name,
        stock: products.stock,
      })
      .from(products)
      .where(and(eq(products.isActive, true), sql`${products.stock} <= 5`))
      .orderBy(products.stock)
      .limit(5);

    const salesByStatus = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .groupBy(orders.status);

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const [weeklyRow] = await db
      .select({ revenue: sql<string>`coalesce(sum(${orders.total}), 0)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, since),
          sql`${orders.status} <> 'cancelled'`,
        ),
      );

    res.json({
      success: true,
      data: {
        revenue: Number(revenueRow?.revenue ?? 0),
        weeklyRevenue: Number(weeklyRow?.revenue ?? 0),
        orders: orderCountRow?.count ?? 0,
        products: productCountRow?.count ?? 0,
        users: userCountRow?.count ?? 0,
        pendingOrders: pendingRow?.count ?? 0,
        salesByStatus,
        recentOrders,
        lowStock,
      },
    });
  },
);
