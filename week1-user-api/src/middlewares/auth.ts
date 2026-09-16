import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../lib/app-error';
import { JwtPayload } from '../types/auth';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Missing or invalid authorization header'));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    return next();
  } catch {
    return next(new AppError(401, 'Invalid or expired token'));
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }
    return next();
  };
}
