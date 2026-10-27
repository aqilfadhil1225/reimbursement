import prisma from '../config/prisma';

const findUserByEmail = (email: string) => prisma.user.findUnique({
  where: { email },
});

const findUserByGoogleId = (googleId: string) => prisma.user.findUnique({
  where: { googleId },
});

const findUserById = (id: number) => prisma.user.findUnique({
  where: { id },
});

const createUser = (data: any) => prisma.user.create({
  data,
});

export default {
  findUserByEmail,
  findUserByGoogleId,
  findUserById,
  createUser,
};
