const prisma = require('../config/prisma');

const USER_ROLES = ['EMPLOYEE', 'MANAGER', 'FINANCE'];

const findAll = (role) => prisma.user.findMany({
  where: role ? { role } : undefined,
  orderBy: { name: 'asc' },
});

const findById = (id) => prisma.user.findUnique({
  where: { id: Number(id) },
});

const create = (data) => prisma.user.create({ data });

const updateById = (id, data) => prisma.user.update({
  where: { id: Number(id) },
  data,
});

const deleteById = (id) => prisma.user.delete({
  where: { id: Number(id) },
});

module.exports = {
  USER_ROLES,
  findAll,
  findById,
  create,
  updateById,
  deleteById,
};
