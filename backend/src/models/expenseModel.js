const prisma = require('../config/prisma');

const findByReimbursementId = (reimbursementId) => prisma.expense.findMany({
  where: { reimbursementId: Number(reimbursementId) },
  orderBy: { expenseDate: 'asc' },
});

const findById = (id) => prisma.expense.findUnique({
  where: { id: Number(id) },
  include: { reimbursement: true },
});

const create = (data) => prisma.expense.create({ data });

const updateById = (id, data) => prisma.expense.update({
  where: { id: Number(id) },
  data,
});

const deleteById = (id) => prisma.expense.delete({
  where: { id: Number(id) },
});

module.exports = {
  findByReimbursementId,
  findById,
  create,
  updateById,
  deleteById,
};
