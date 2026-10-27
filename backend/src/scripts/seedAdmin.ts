import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma';

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: 'MANAGER' | 'FINANCE';
};

const requiredCredential = (name: string) => {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`${name} must be configured before seeding privileged users.`);
  }
  return value;
};

const getSeedUsers = (): SeedUser[] => [
  {
    name: 'Admin Manager',
    email: requiredCredential('SEED_MANAGER_EMAIL').trim().toLowerCase(),
    password: requiredCredential('SEED_MANAGER_PASSWORD'),
    role: 'MANAGER',
  },
  {
    name: 'Finance Admin',
    email: requiredCredential('SEED_FINANCE_EMAIL').trim().toLowerCase(),
    password: requiredCredential('SEED_FINANCE_PASSWORD'),
    role: 'FINANCE',
  },
];

const main = async () => {
  for (const seedUser of getSeedUsers()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seedUser.email)) {
      throw new Error(`The configured ${seedUser.role} seed email is invalid.`);
    }
    if (Buffer.byteLength(seedUser.password, 'utf8') < 12) {
      throw new Error(`The configured ${seedUser.role} seed password must contain at least 12 bytes.`);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: seedUser.email } });
    if (existingUser) {
      if (existingUser.role !== seedUser.role) {
        throw new Error(`The configured ${seedUser.role} email belongs to a different role.`);
      }
      console.log(`${seedUser.role} seed account already exists; credentials were not changed.`);
      continue;
    }

    const password = await bcrypt.hash(seedUser.password, 12);

    const user = await prisma.user.create({
      data: {
        name: seedUser.name,
        email: seedUser.email,
        password,
        role: seedUser.role,
        hasLocalPassword: true,
      },
    });

    console.log(`Created ${user.role} seed account: ${user.email}.`);
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
