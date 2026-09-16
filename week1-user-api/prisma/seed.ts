import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const passwordPlain = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const name = process.env.SEED_ADMIN_NAME ?? 'Admin User';

  const password = await bcrypt.hash(passwordPlain, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password,
      role: Role.ADMIN,
    },
    create: {
      email,
      name,
      password,
      role: Role.ADMIN,
    },
  });

  console.log(`Seeded admin user: ${admin.email} (${admin.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
