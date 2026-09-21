import prisma from '../config/prisma';

const findAll = ({ reimbursementId, actorId }: { reimbursementId?: unknown; actorId?: unknown } = {}) => prisma.auditLog.findMany({
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

const create = (data: any) => prisma.auditLog.create({ data });

export default {
  findAll,
  create,
};
