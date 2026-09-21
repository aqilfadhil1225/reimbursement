import { RequestHandler } from 'express';
import paymentService from '../services/paymentService';
import apiView from '../views/apiView';

const getPayment: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any> };
    const payment = await paymentService.getPayment(authReq.params.reimbursementId, authReq.user);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment belum ditemukan.' });
    }

    return res.json({ success: true, data: apiView.formatPayment(payment) });
  } catch (error) {
    return next(error);
  }
};

const completePayment: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any>; body: Record<string, any> };
    const payment: any = await paymentService.completePayment(authReq.params.reimbursementId, {
      ...authReq.body,
      actorId: authReq.user.id,
    }, authReq.user);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    }

    if (payment.error) {
      return res.status(400).json({ success: false, message: payment.error });
    }

    return res.status(201).json({ success: true, data: apiView.formatPayment(payment) });
  } catch (error) {
    return next(error);
  }
};

export default {
  getPayment,
  completePayment,
};
