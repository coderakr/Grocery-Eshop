import { z } from 'zod';
import type { Request, Response } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { cartItems, products } from '../db/schema.js';
import { ApiError, asyncHandler } from '../utils/http.js';

export const addCartItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});

async function buildCart(userId: number) {
  const items = await db.query.cartItems.findMany({
    where: eq(cartItems.userId, userId),
    orderBy: cartItems.createdAt,
    with: {
      product: {
        with: { category: { columns: { id: true, name: true, slug: true } } },
      },
    },
  });

  const normalized = items.map((item) => {
    const unitPrice = Number(item.product.price);
    return {
      id: item.id,
      quantity: item.quantity,
      product: item.product,
      lineTotal: Number((unitPrice * item.quantity).toFixed(2)),
    };
  });

  const subtotal = Number(
    normalized.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
  );
  const itemCount = normalized.reduce((sum, item) => sum + item.quantity, 0);

  return { items: normalized, subtotal, itemCount };
}

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await buildCart(req.user!.id);
  res.json({ success: true, data: cart });
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity } = addCartItemSchema.parse(req.body);
  const userId = req.user!.id;

  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const [existing] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
    .limit(1);

  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  if (nextQuantity > product.stock) {
    throw ApiError.badRequest(
      `Only ${product.stock} item(s) of ${product.name} available`,
    );
  }

  if (existing) {
    await db
      .update(cartItems)
      .set({ quantity: nextQuantity, updatedAt: new Date() })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity });
  }

  const cart = await buildCart(userId);
  res.status(201).json({ success: true, data: cart });
});

export const updateCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const itemId = Number(req.params.itemId);
    const { quantity } = updateCartItemSchema.parse(req.body);
    const userId = req.user!.id;

    const [item] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .limit(1);

    if (!item) {
      throw ApiError.notFound('Cart item not found');
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (product && quantity > product.stock) {
      throw ApiError.badRequest(
        `Only ${product.stock} item(s) of ${product.name} available`,
      );
    }

    await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, itemId));

    const cart = await buildCart(userId);
    res.json({ success: true, data: cart });
  },
);

export const removeCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const itemId = Number(req.params.itemId);
    const userId = req.user!.id;

    const [deleted] = await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .returning();

    if (!deleted) {
      throw ApiError.notFound('Cart item not found');
    }

    const cart = await buildCart(userId);
    res.json({ success: true, data: cart });
  },
);

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
  const cart = await buildCart(userId);
  res.json({ success: true, data: cart });
});
