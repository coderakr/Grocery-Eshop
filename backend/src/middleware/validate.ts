import { z } from 'zod';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/http.js';

type Schemas = {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
};

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request['params'];
      }
      if (schemas.query) {
        Object.assign(req.query, schemas.query.parse(req.query));
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(
          ApiError.badRequest('Validation failed', z.treeifyError(error)),
        );
        return;
      }
      next(error);
    }
  };
}
