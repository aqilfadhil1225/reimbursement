const auditLogService = require('../services/auditLogService');

const listAuditLogs = async (req, res, next) => {
  try {
    const auditLogs = await auditLogService.getAuditLogs(req.query);
    return res.json({ success: true, data: auditLogs });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listAuditLogs,
};
