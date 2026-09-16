import { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/app-error';
import { logger } from '../lib/logger';
import { env } from '../config/env';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, 'Route not found'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      ...(err.errors !== undefined ? { errors: err.errors } : {}),
    });
  }

  logger.error('Unhandled error', {
    message: err instanceof Error ? err.message : 'Unknown error',
    stack: err instanceof Error && env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  return res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
  });
}
