import { RequestHandler } from 'express';
import expenseService from '../services/expenseService';
import apiView from '../views/apiView';

const listExpenses: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any> };
    const expenses = await expenseService.getExpenses(authReq.params.reimbursementId, authReq.user);
    if (!expenses) return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    return res.json({ success: true, data: expenses.map(apiView.formatExpense) });
  } catch (error) {
    return next(error);
  }
};

const createExpense: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any>; body: Record<string, any> };
    const expense = await expenseService.createExpense(authReq.params.reimbursementId, authReq.body, authReq.user);
    if (!expense) return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    return res.status(201).json({ success: true, data: apiView.formatExpense(expense) });
  } catch (error) {
    return next(error);
  }
};

const updateExpense: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any>; body: Record<string, any> };
    const expense = await expenseService.updateExpense(authReq.params.id, authReq.body, authReq.user);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense tidak ditemukan.' });
    return res.json({ success: true, data: apiView.formatExpense(expense) });
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
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any>; file?: any; protocol: string; get: (header: string) => string };
    if (!authReq.file) {
      return res.status(400).json({ success: false, message: 'File bukti wajib dikirim.' });
    }
    const receiptUrl = `${authReq.protocol}://${authReq.get('host')}/uploads/${authReq.file.filename}`;
    const expense = await expenseService.updateReceipt(authReq.params.id, receiptUrl, authReq.user);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense tidak ditemukan.' });
    return res.json({ success: true, data: apiView.formatExpense(expense) });
  } catch (error) {
    return next(error);
  }
};

export default {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
};
