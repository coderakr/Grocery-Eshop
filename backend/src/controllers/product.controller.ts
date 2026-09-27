import { z } from 'zod';
import type { Request, Response } from 'express';
import { and, asc, desc, eq, gte, ilike, lte, ne, or, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { categories, products } from '../db/schema.js';
import { ApiError, asyncHandler } from '../utils/http.js';
import { slugify } from '../utils/slug.js';

export const productQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  featured: z.enum(['true', 'false']).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z
    .enum(['newest', 'price-asc', 'price-desc', 'name-asc'])
    .default('newest'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
  all: z.enum(['true', 'false']).optional(),
});

export const productBodySchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(4000).nullable().optional(),
  price: z.coerce.number().nonnegative(),
  compareAtPrice: z.coerce.number().nonnegative().nullable().optional(),
  unit: z.string().max(40).default('each'),
  stock: z.coerce.number().int().nonnegative().default(0),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
});

export const productUpdateSchema = productBodySchema.partial();

function orderByClause(sort: string) {
  switch (sort) {
    case 'price-asc':
      return [asc(products.price)];
    case 'price-desc':
      return [desc(products.price)];
    case 'name-asc':
      return [asc(products.name)];
    default:
      return [desc(products.createdAt)];
  }
}

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = productQuerySchema.parse(req.query);
  const { search, category, categoryId, featured, minPrice, maxPrice, page, limit } =
    query;
  const includeInactive = query.all === 'true' && req.user?.role === 'admin';

  const conditions = [];
  if (!includeInactive) conditions.push(eq(products.isActive, true));
  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.description, `%${search}%`),
      ),
    );
  }
  if (featured) conditions.push(eq(products.isFeatured, featured === 'true'));
  if (minPrice !== undefined) conditions.push(gte(products.price, String(minPrice)));
  if (maxPrice !== undefined) conditions.push(lte(products.price, String(maxPrice)));
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));
  if (category) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);
    if (!cat) {
      res.json({
        success: true,
        data: { items: [], total: 0, page, limit, pages: 0 },
      });
      return;
    }
    conditions.push(eq(products.categoryId, cat.id));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  const total = countRow?.count ?? 0;

  const items = await db.query.products.findMany({
    where,
    orderBy: orderByClause(query.sort),
    limit,
    offset: (page - 1) * limit,
    with: { category: { columns: { id: true, name: true, slug: true } } },
  });

  res.json({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;
  const numericId = Number(idOrSlug);
  const isId = Number.isInteger(numericId) && numericId > 0;

  const product = await db.query.products.findFirst({
    where: isId
      ? eq(products.id, numericId)
      : eq(products.slug, String(idOrSlug)),
    with: { category: { columns: { id: true, name: true, slug: true } } },
  });

  if (!product || (!product.isActive && req.user?.role !== 'admin')) {
    throw ApiError.notFound('Product not found');
  }

  const related = product.categoryId
    ? await db.query.products.findMany({
        where: and(
          eq(products.categoryId, product.categoryId),
          ne(products.id, product.id),
          eq(products.isActive, true),
        ),
        limit: 4,
        with: { category: { columns: { id: true, name: true, slug: true } } },
      })
    : [];

  res.json({ success: true, data: { product, related } });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = productBodySchema.parse(req.body);
  const baseSlug = slugify(input.name);
  const slug = await uniqueProductSlug(baseSlug);

  const [product] = await db
    .insert(products)
    .values({
      name: input.name,
      slug,
      description: input.description ?? null,
      price: input.price.toFixed(2),
      compareAtPrice:
        input.compareAtPrice !== undefined && input.compareAtPrice !== null
          ? input.compareAtPrice.toFixed(2)
          : null,
      unit: input.unit,
      stock: input.stock,
      imageUrl: input.imageUrl ?? null,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      categoryId: input.categoryId ?? null,
    })
    .returning();

  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const input = productUpdateSchema.parse(req.body);

  const updates: Partial<typeof products.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.name !== undefined) {
    updates.name = input.name;
    updates.slug = await uniqueProductSlug(slugify(input.name), id);
  }
  if (input.description !== undefined) updates.description = input.description;
  if (input.price !== undefined) updates.price = input.price.toFixed(2);
  if (input.compareAtPrice !== undefined) {
    updates.compareAtPrice =
      input.compareAtPrice === null ? null : input.compareAtPrice.toFixed(2);
  }
  if (input.unit !== undefined) updates.unit = input.unit;
  if (input.stock !== undefined) updates.stock = input.stock;
  if (input.imageUrl !== undefined) updates.imageUrl = input.imageUrl;
  if (input.isActive !== undefined) updates.isActive = input.isActive;
  if (input.isFeatured !== undefined) updates.isFeatured = input.isFeatured;
  if (input.categoryId !== undefined) updates.categoryId = input.categoryId;

  const [product] = await db
    .update(products)
    .set(updates)
    .where(eq(products.id, id))
    .returning();

  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [product] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();

  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  res.json({ success: true, data: { id: product.id } });
});

async function uniqueProductSlug(base: string, ignoreId?: number): Promise<string> {
  let candidate = base || 'product';
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const conditions = [eq(products.slug, candidate)];
    if (ignoreId) conditions.push(ne(products.id, ignoreId));
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(and(...conditions))
      .limit(1);
    if (existing.length === 0) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}
