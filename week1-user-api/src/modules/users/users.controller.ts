import { NextFunction, Request, Response } from 'express';
import * as usersService from './users.service';
import { UpdateUserInput } from './users.schema';

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await usersService.listUsers();
    res.status(200).json({ data: users });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getMe(req.user!);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.user!, req.params.id);
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUser(
      req.user!,
      req.params.id,
      req.body as UpdateUserInput,
    );
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    await usersService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
