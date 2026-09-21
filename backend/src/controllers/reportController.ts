import { RequestHandler } from 'express';
import reportService from '../services/reportService';

const getSummary: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; query: Record<string, any> };
    const summary = await reportService.getSummary(authReq.user, {
      status: authReq.query.status?.trim().toUpperCase(),
      from: authReq.query.from,
      to: authReq.query.to,
    });
    return res.json({ success: true, data: summary });
  } catch (error) {
    return next(error);
  }
};

export default { getSummary };
