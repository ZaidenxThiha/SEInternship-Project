import { z } from 'zod';
import { Role } from '@prisma/client';

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: z.nativeEnum(Role).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
