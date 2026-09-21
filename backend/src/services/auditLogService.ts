import auditLogModel from '../models/auditLogModel';

const validateOptionalId = (id: unknown, label: string) => {
  if (id === undefined) return undefined;

  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new Error(`${label} tidak valid.`);
  }

  return parsedId;
};

const getAuditLogs = ({ reimbursementId, actorId }: { reimbursementId?: unknown; actorId?: unknown }) => auditLogModel.findAll({
  reimbursementId: validateOptionalId(reimbursementId, 'reimbursementId'),
  actorId: validateOptionalId(actorId, 'actorId'),
});

export default {
  getAuditLogs,
};
