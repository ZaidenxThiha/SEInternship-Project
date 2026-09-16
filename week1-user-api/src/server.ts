import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

async function main() {
  const app = createApp();

  await prisma.$connect();

  app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
    logger.info(`Swagger docs at http://localhost:${env.PORT}/api/docs`);
  });
}

main().catch(async (error) => {
  logger.error('Failed to start server', {
    message: error instanceof Error ? error.message : 'Unknown error',
  });
  await prisma.$disconnect();
  process.exit(1);
});
