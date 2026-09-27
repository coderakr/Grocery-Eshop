import { z } from 'zod';
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { ApiError, asyncHandler } from '../utils/http.js';
import { signAuthToken } from '../utils/jwt.js';
import { isProduction } from '../config/env.js';

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  phone: z.string().max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().max(30).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  password: z.string().min(6).max(100).optional(),
});

export const registerSchemaExport = registerSchema;
export const loginSchemaExport = loginSchema;
export const updateProfileSchemaExport = updateProfileSchema;

function publicUser(user: typeof users.$inferSelect) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone } = registerSchema.parse(req.body);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await hash(password, 10);
  const [user] = await db
    .insert(users)
    .values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone: phone ?? null,
    })
    .returning();

  if (!user) {
    throw new ApiError(500, 'Could not create user');
  }

  const token = signAuthToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  setAuthCookie(res, token);

  res.status(201).json({ success: true, data: { user: publicUser(user), token } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user || !(await compare(password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signAuthToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  setAuthCookie(res, token);

  res.json({ success: true, data: { user: publicUser(user), token } });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, data: { message: 'Logged out' } });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user!.id))
    .limit(1);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.json({ success: true, data: { user: publicUser(user) } });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const input = updateProfileSchema.parse(req.body);

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.name !== undefined) updates.name = input.name;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.address !== undefined) updates.address = input.address;
  if (input.password !== undefined) {
    updates.passwordHash = await hash(input.password, 10);
  }

  const [user] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, req.user!.id))
    .returning();

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  res.json({ success: true, data: { user: publicUser(user) } });
});
