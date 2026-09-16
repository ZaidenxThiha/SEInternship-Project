import { NextFunction, Request, Response } from 'express';
import * as authService from './auth.service';
import { LoginInput, RegisterInput } from './auth.schema';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body as RegisterInput);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body as LoginInput);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
