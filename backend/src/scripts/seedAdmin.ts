import bcrypt from 'bcrypt';
import prisma from '../config/prisma';

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: 'MANAGER' | 'FINANCE';
};

const seedUsers: SeedUser[] = [
  {
    name: 'Admin Manager',
    email: process.env.SEED_MANAGER_EMAIL ?? 'admin@reimbursement.local',
    password: process.env.SEED_MANAGER_PASSWORD ?? 'admin123',
    role: 'MANAGER',
  },
  {
    name: 'Finance Admin',
    email: process.env.SEED_FINANCE_EMAIL ?? 'finance@reimbursement.local',
    password: process.env.SEED_FINANCE_PASSWORD ?? 'finance123',
    role: 'FINANCE',
  },
];

const main = async () => {
  for (const seedUser of seedUsers) {
    const password = await bcrypt.hash(seedUser.password, 12);

    const user = await prisma.user.upsert({
      where: { email: seedUser.email.toLowerCase() },
      update: {
        name: seedUser.name,
        password,
        role: seedUser.role,
        hasLocalPassword: true,
      },
      create: {
        name: seedUser.name,
        email: seedUser.email.toLowerCase(),
        password,
        role: seedUser.role,
        hasLocalPassword: true,
      },
    });

    console.log(`Seeded ${user.role} user: ${user.email} / ${seedUser.password}`);
  }
};

main()
  .catch((error) => {
    console.error('Failed to seed admin users:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
