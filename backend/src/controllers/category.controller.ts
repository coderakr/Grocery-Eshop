import { z } from 'zod';
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { ApiError, asyncHandler } from '../utils/http.js';
import { slugify } from '../utils/slug.js';

export const categoryBodySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
});

export const categoryUpdateSchema = categoryBodySchema.partial();

export const listCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const rows = await db.select().from(categories).orderBy(categories.name);
    res.json({ success: true, data: rows });
  },
);

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!category) {
    throw ApiError.notFound('Category not found');
  }
  res.json({ success: true, data: category });
});

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const input = categoryBodySchema.parse(req.body);
    const slug = slugify(input.name);

    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    if (existing.length > 0) {
      throw ApiError.conflict('A category with this name already exists');
    }

    const [category] = await db
      .insert(categories)
      .values({
        name: input.name,
        slug,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
      })
      .returning();

    res.status(201).json({ success: true, data: category });
  },
);

export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const input = categoryUpdateSchema.parse(req.body);

    const updates: Partial<typeof categories.$inferInsert> = {};
    if (input.name !== undefined) {
      updates.name = input.name;
      updates.slug = slugify(input.name);
    }
    if (input.description !== undefined) updates.description = input.description;
    if (input.imageUrl !== undefined) updates.imageUrl = input.imageUrl;

    const [category] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();

    if (!category) {
      throw ApiError.notFound('Category not found');
    }
    res.json({ success: true, data: category });
  },
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const [category] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();

    if (!category) {
      throw ApiError.notFound('Category not found');
    }
    res.json({ success: true, data: { id: category.id } });
  },
);
