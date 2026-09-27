import type { NextFunction, Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { ApiError } from '../utils/http.js';
import { isProduction } from '../config/env.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: z.treeifyError(err),
    });
    return;
  }

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  if (!isProduction) {
    console.error(err);
  }

  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : message,
  });
}
