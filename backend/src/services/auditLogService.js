const auditLogModel = require('../models/auditLogModel');

const validateOptionalId = (id, label) => {
  if (id === undefined) return undefined;

  const parsedId = Number(id);
  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new Error(`${label} tidak valid.`);
  }

  return parsedId;
};

const getAuditLogs = ({ reimbursementId, actorId }) => auditLogModel.findAll({
  reimbursementId: validateOptionalId(reimbursementId, 'reimbursementId'),
  actorId: validateOptionalId(actorId, 'actorId'),
});

module.exports = {
  getAuditLogs,
};
