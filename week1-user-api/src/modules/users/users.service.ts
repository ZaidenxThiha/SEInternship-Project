import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { AppError } from '../../lib/app-error';
import { prisma } from '../../lib/prisma';
import { JwtPayload } from '../../types/auth';
import { UpdateUserInput } from './users.schema';

const SALT_ROUNDS = 10;

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function assertSelfOrAdmin(actor: JwtPayload, targetId: string) {
  if (actor.role !== Role.ADMIN && actor.sub !== targetId) {
    throw new AppError(403, 'Insufficient permissions');
  }
}

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return users;
}

export async function getMe(actor: JwtPayload) {
  const user = await prisma.user.findUnique({ where: { id: actor.sub } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  return toPublicUser(user);
}

export async function getUserById(actor: JwtPayload, id: string) {
  assertSelfOrAdmin(actor, id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  return toPublicUser(user);
}

export async function updateUser(actor: JwtPayload, id: string, input: UpdateUserInput) {
  assertSelfOrAdmin(actor, id);

  if (input.role !== undefined && actor.role !== Role.ADMIN) {
    throw new AppError(403, 'Only admins can change roles');
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'User not found');
  }

  if (input.email && input.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: input.email } });
    if (emailTaken) {
      throw new AppError(409, 'Email already registered');
    }
  }

  const data: {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
  } = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email;
  if (input.role !== undefined) data.role = input.role;
  if (input.password !== undefined) {
    data.password = await bcrypt.hash(input.password, SALT_ROUNDS);
  }

  const user = await prisma.user.update({ where: { id }, data });
  return toPublicUser(user);
}

export async function deleteUser(id: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'User not found');
  }
  await prisma.user.delete({ where: { id } });
}
