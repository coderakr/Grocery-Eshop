import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/http.js';
import { verifyAuthToken } from '../utils/jwt.js';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  const cookieToken = req.cookies?.token;
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  return null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    next(ApiError.unauthorized('Authentication required'));
    return;
  }

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = verifyAuthToken(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(ApiError.unauthorized('Authentication required'));
    return;
  }
  if (req.user.role !== 'admin') {
    next(ApiError.forbidden('Admin access required'));
    return;
  }
  next();
}
