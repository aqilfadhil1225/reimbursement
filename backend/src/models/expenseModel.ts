import prisma from '../config/prisma';

const findByReimbursementId = (reimbursementId: unknown) => prisma.expense.findMany({
  where: { reimbursementId: Number(reimbursementId) },
  orderBy: { expenseDate: 'asc' },
});

const findById = (id: unknown) => prisma.expense.findUnique({
  where: { id: Number(id) },
  include: { reimbursement: true },
});

const create = (data: any) => prisma.expense.create({ data });

const updateById = (id: unknown, data: any) => prisma.expense.update({
  where: { id: Number(id) },
  data,
});

const deleteById = (id: unknown) => prisma.expense.delete({
  where: { id: Number(id) },
});

export default {
  findByReimbursementId,
  findById,
  create,
  updateById,
  deleteById,
};
