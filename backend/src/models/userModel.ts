import prisma from '../config/prisma';

const USER_ROLES = ['EMPLOYEE', 'MANAGER', 'FINANCE'];

const findAll = (role?: string) => prisma.user.findMany({
  where: role ? { role: role as any } : undefined,
  orderBy: { name: 'asc' },
});

const findById = (id: unknown) => prisma.user.findUnique({
  where: { id: Number(id) },
});

const findByGoogleId = (googleId: string) => prisma.user.findUnique({
  where: { googleId },
});

const create = (data: any) => prisma.user.create({ data });

const updateById = (id: unknown, data: any) => prisma.user.update({
  where: { id: Number(id) },
  data,
});

const deleteById = (id: unknown) => prisma.user.delete({
  where: { id: Number(id) },
});

export default {
  USER_ROLES,
  findAll,
  findById,
  findByGoogleId,
  create,
  updateById,
  deleteById,
};
