import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'Week 1 User Management API',
      health: '/health',
      docs: '/api/docs',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
      },
      users: '/api/users',
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
