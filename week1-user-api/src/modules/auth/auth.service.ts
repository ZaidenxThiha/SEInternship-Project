import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../../config/env';
import { AppError } from '../../lib/app-error';
import { prisma } from '../../lib/prisma';
import { LoginInput, RegisterInput } from './auth.schema';

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

function signToken(user: { id: string; email: string; role: Role }) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const password = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password,
      name: input.name,
      role: Role.USER,
    },
  });

  const accessToken = signToken(user);
  return { user: toPublicUser(user), accessToken };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const accessToken = signToken(user);
  return { user: toPublicUser(user), accessToken };
}
