import { RequestHandler } from 'express';
import reimbursementService from '../services/reimbursementService';
import reimbursementView from '../views/reimbursementView';

const listReimbursements: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any };
    const reimbursements = await reimbursementService.getAllReimbursements(authReq.user);
    return res.json({
      success: true,
      data: reimbursementView.formatReimbursements(reimbursements),
    });
  } catch (error) {
    return next(error);
  }
};

const getReimbursement: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any> };
    const reimbursement = await reimbursementService.getReimbursementById(authReq.params.id, authReq.user);

    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found.' });
    }

    return res.json({ success: true, data: reimbursementView.formatReimbursement(reimbursement) });
  } catch (error) {
    return next(error);
  }
};

const updateReimbursement: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any>; body: Record<string, any> };
    const reimbursement = await reimbursementService.updateReimbursement(authReq.params.id, authReq.body, authReq.user);
    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    }
    return res.json({ success: true, data: reimbursementView.formatReimbursement(reimbursement) });
  } catch (error) {
    return next(error);
  }
};

const deleteReimbursement: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any> };
    const reimbursement = await reimbursementService.deleteReimbursement(authReq.params.id, authReq.user);
    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const createReimbursement: RequestHandler = async (req, res) => {
  try {
    const authReq = req as typeof req & { user?: any; body: Record<string, any> };
    const reimbursement = await reimbursementService.createReimbursement({
      ...authReq.body,
      employeeId: authReq.user.id,
      employeeName: authReq.user.name,
      employeeEmail: authReq.user.email,
      managerId: undefined,
      financeId: undefined,
      status: 'DRAFT',
    });

    return res.status(201).json({
      success: true,
      data: reimbursementView.formatReimbursement(reimbursement),
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const submitReimbursement: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any> };
    const result: any = await reimbursementService.submitReimbursement(authReq.params.id, authReq.user.id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found.' });
    }

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.json({ success: true, data: reimbursementView.formatReimbursement(result) });
  } catch (error) {
    return next(error);
  }
};

const managerDecision: RequestHandler = async (req, res, next) => {
  const authReq = req as typeof req & { user?: any; params: Record<string, any>; body: Record<string, any> };
  const { action, note } = authReq.body;
  try {
    const result: any = await reimbursementService.managerReview(authReq.params.id, action, note, authReq.user.id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found.' });
    }

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.json({ success: true, data: reimbursementView.formatReimbursement(result) });
  } catch (error) {
    return next(error);
  }
};

const financeDecision: RequestHandler = async (req, res, next) => {
  const authReq = req as typeof req & { user?: any; params: Record<string, any>; body: Record<string, any> };
  const { action, note } = authReq.body;
  try {
    const result: any = await reimbursementService.financeReview(authReq.params.id, action, note, authReq.user.id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Reimbursement not found.' });
    }

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.json({ success: true, data: reimbursementView.formatReimbursement(result) });
  } catch (error) {
    return next(error);
  }
};

const uploadReceipt: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any>; file?: any; protocol: string; get: (header: string) => string };
    if (!authReq.file) {
      return res.status(400).json({ success: false, message: 'File bukti wajib dikirim.' });
    }
    const reimbursement = await reimbursementService.getReimbursementById(authReq.params.id, authReq.user);
    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    }
    if (!['DRAFT', 'REVISION_REQUIRED'].includes(reimbursement.status)) {
      return res.status(400).json({ success: false, message: 'Bukti hanya bisa diunggah saat DRAFT atau REVISION_REQUIRED.' });
    }
    const receiptUrl = `${authReq.protocol}://${authReq.get('host')}/uploads/${authReq.file.filename}`;
    const updated = await reimbursementService.updateReimbursement(authReq.params.id, { receiptUrl }, authReq.user);
    return res.json({ success: true, data: reimbursementView.formatReimbursement(updated) });
  } catch (error) {
    return next(error);
  }
};

export default {
  listReimbursements,
  getReimbursement,
  updateReimbursement,
  deleteReimbursement,
  createReimbursement,
  submitReimbursement,
  managerDecision,
  financeDecision,
  uploadReceipt,
};
