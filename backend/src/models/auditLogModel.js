const prisma = require('../config/prisma');

const findAll = ({ reimbursementId, actorId } = {}) => prisma.auditLog.findMany({
  where: {
    reimbursementId: reimbursementId ? Number(reimbursementId) : undefined,
    actorId: actorId ? Number(actorId) : undefined,
  },
  include: {
    actor: true,
    reimbursement: true,
  },
  orderBy: { createdAt: 'desc' },
});

const create = (data) => prisma.auditLog.create({ data });

module.exports = {
  findAll,
  create,
};
