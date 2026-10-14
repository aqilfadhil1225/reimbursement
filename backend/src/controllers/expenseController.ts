import { RequestHandler } from 'express';
import { randomBytes } from 'crypto';
import expenseService from '../services/expenseService';
import apiView from '../views/apiView';
import objectStorageService from '../services/objectStorageService';

const listExpenses: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any> };
    const expenses = await expenseService.getExpenses(authReq.params.reimbursementId, authReq.user);
    if (!expenses) return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    return res.json({ success: true, data: await Promise.all(expenses.map(apiView.formatExpense)) });
  } catch (error) {
    return next(error);
  }
};

const createExpense: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any>; body: Record<string, any> };
    const expense = await expenseService.createExpense(authReq.params.reimbursementId, authReq.body, authReq.user);
    if (!expense) return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    return res.status(201).json({ success: true, data: await apiView.formatExpense(expense) });
  } catch (error) {
    return next(error);
  }
};

const updateExpense: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any>; body: Record<string, any> };
    const expense = await expenseService.updateExpense(authReq.params.id, authReq.body, authReq.user);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense tidak ditemukan.' });
    return res.json({ success: true, data: await apiView.formatExpense(expense) });
  } catch (error) {
    return next(error);
  }
};

const deleteExpense: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any> };
    const expense = await expenseService.deleteExpense(authReq.params.id, authReq.user);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense tidak ditemukan.' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const uploadReceipt: RequestHandler = async (req, res, next) => {
  let uploadedObjectKey: string | undefined;
  let receiptUpdateCommitted = false;
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any>; file?: Express.Multer.File };
    if (!authReq.file) {
      return res.status(400).json({ success: false, message: 'File bukti wajib dikirim.' });
    }
    if (!objectStorageService.isValidEvidenceFile(authReq.file)) {
      return res.status(400).json({ success: false, message: 'Isi file tidak sesuai dengan format bukti yang dipilih.' });
    }

    const extensionsByMimeType: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'application/pdf': '.pdf',
    };
    const reimbursementId = Number(authReq.params.reimbursementId);
    const expenseId = Number(authReq.params.id);
    uploadedObjectKey = `expense-receipts/${reimbursementId}/${expenseId}/${randomBytes(16).toString('hex')}${extensionsByMimeType[authReq.file.mimetype]}`;
    await objectStorageService.uploadObject(uploadedObjectKey, authReq.file.buffer, authReq.file.mimetype);
    const result = await expenseService.updateReceipt(authReq.params.id, uploadedObjectKey, authReq.user);
    if (!result) return res.status(404).json({ success: false, message: 'Expense tidak ditemukan.' });

    receiptUpdateCommitted = true;
    if (typeof result.previousReceiptUrl === 'string' && objectStorageService.isReceiptObjectKey(result.previousReceiptUrl)) {
      try {
        await objectStorageService.deleteObject(result.previousReceiptUrl);
      } catch (error) {
        console.error('Failed to remove the replaced expense receipt from MinIO:', error);
      }
    }
    return res.json({ success: true, data: await apiView.formatExpense(result.expense) });
  } catch (error) {
    return next(error);
  } finally {
    if (uploadedObjectKey && !receiptUpdateCommitted) {
      try {
        await objectStorageService.deleteObject(uploadedObjectKey);
      } catch (cleanupError) {
        console.error('Failed to remove an uncommitted expense receipt from MinIO:', cleanupError);
      }
    }
  }
};

export default {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
};
