import { NextFunction, Request, Response } from 'express';
import auditLogService from '../services/auditLogService';
import apiView from '../views/apiView';

const listAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auditLogs = await auditLogService.getAuditLogs(req.query as any);
    return res.json({ success: true, data: auditLogs.map(apiView.formatAuditLog) });
  } catch (error) {
    return next(error);
  }
};

export default {
  listAuditLogs,
};
