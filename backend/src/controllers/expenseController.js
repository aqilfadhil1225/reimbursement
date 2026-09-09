const expenseService = require('../services/expenseService');
const apiView = require('../views/apiView');

const listExpenses = async (req, res, next) => {
  try {
    const expenses = await expenseService.getExpenses(req.params.reimbursementId, req.user);
    if (!expenses) return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    return res.json({ success: true, data: expenses.map(apiView.formatExpense) });
  } catch (error) {
    return next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(req.params.reimbursementId, req.body, req.user);
    if (!expense) return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    return res.status(201).json({ success: true, data: apiView.formatExpense(expense) });
  } catch (error) {
    return next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body, req.user);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense tidak ditemukan.' });
    return res.json({ success: true, data: apiView.formatExpense(expense) });
  } catch (error) {
    return next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.deleteExpense(req.params.id, req.user);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense tidak ditemukan.' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const uploadReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File bukti wajib dikirim.' });
    }
    const receiptUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const expense = await expenseService.updateReceipt(req.params.id, receiptUrl, req.user);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense tidak ditemukan.' });
    return res.json({ success: true, data: apiView.formatExpense(expense) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
};
