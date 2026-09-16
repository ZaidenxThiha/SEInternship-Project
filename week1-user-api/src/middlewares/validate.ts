import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { AppError } from '../lib/app-error';

type RequestSchemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export function validate(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request['query'];
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request['params'];
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(400, 'Validation failed', error.flatten().fieldErrors),
        );
      }
      return next(error);
    }
  };
}
