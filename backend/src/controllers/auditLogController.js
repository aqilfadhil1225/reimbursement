const auditLogService = require('../services/auditLogService');
const apiView = require('../views/apiView');

const listAuditLogs = async (req, res, next) => {
  try {
    const auditLogs = await auditLogService.getAuditLogs(req.query);
    return res.json({ success: true, data: auditLogs.map(apiView.formatAuditLog) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listAuditLogs,
};
