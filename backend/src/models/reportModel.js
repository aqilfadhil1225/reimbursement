const prisma = require('../config/prisma');

const getSummary = async (where) => {
  const [total, byStatus, amount] = await Promise.all([
    prisma.reimbursement.count({ where }),
    prisma.reimbursement.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.reimbursement.aggregate({ where, _sum: { amount: true } }),
  ]);

  return {
    total,
    totalAmount: amount._sum.amount || 0,
    byStatus: byStatus.reduce((result, row) => ({
      ...result,
      [row.status]: { count: row._count._all, amount: row._sum.amount || 0 },
    }), {}),
  };
};

const getWhere = ({ baseWhere, status, from, to }) => ({
  ...baseWhere,
  ...(status ? { status } : {}),
  ...((from || to) && {
    createdAt: {
      ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    },
  }),
});

module.exports = { getSummary, getWhere };