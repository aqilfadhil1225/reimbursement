import prisma from '../config/prisma';

const findUserByEmail = (email: string) => prisma.user.findUnique({
  where: { email },
});

const createUser = (data: any) => prisma.user.create({
  data,
});

export default {
  findUserByEmail,
  createUser,
};
