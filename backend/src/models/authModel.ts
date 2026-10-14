import prisma from '../config/prisma';

const findUserByEmail = (email: string) => prisma.user.findUnique({
  where: { email },
});

const findUserByGoogleId = (googleId: string) => prisma.user.findUnique({
  where: { googleId },
});

const createUser = (data: any) => prisma.user.create({
  data,
});

export default {
  findUserByEmail,
  findUserByGoogleId,
  createUser,
};
