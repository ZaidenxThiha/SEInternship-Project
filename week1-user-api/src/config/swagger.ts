import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Week 1 User Management API',
      version: '1.0.0',
      description:
        'Internship Week 1 deliverable: CRUD user API with JWT auth, RBAC, Prisma, and PostgreSQL.',
    },
    servers: [{ url: `http://localhost:${env.PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.ts', './dist/modules/**/*.js'],
});
