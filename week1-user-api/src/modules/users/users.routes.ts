import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as usersController from './users.controller';
import { updateUserSchema, userIdParamsSchema } from './users.schema';

const router = Router();

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 */
router.get('/me', authenticate, usersController.getMe);

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User list
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticate, authorize(Role.ADMIN), usersController.listUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by id (self or Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User found
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.get(
  '/:id',
  authenticate,
  validate({ params: userIdParamsSchema }),
  usersController.getUserById,
);

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user (self or Admin; role change Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               role: { type: string, enum: [USER, ADMIN] }
 *     responses:
 *       200:
 *         description: Updated user
 */
router.patch(
  '/:id',
  authenticate,
  validate({ params: userIdParamsSchema, body: updateUserSchema }),
  usersController.updateUser,
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Deleted
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/:id',
  authenticate,
  authorize(Role.ADMIN),
  validate({ params: userIdParamsSchema }),
  usersController.deleteUser,
);

export default router;
