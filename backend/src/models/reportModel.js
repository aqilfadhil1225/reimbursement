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

module.exports = { getSummary };