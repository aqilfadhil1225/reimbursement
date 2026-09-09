const expenseModel = require('../models/expenseModel');
const reimbursementModel = require('../models/reimbursementModel');

const validateId = (id, label) => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new Error(`${label} tidak valid.`);
  }

  return parsedId;
};

const validateExpense = ({ category, amount, expenseDate, description }) => {
  if (!category || amount === undefined || amount === null || !expenseDate || !description) {
    throw new Error('category, amount, expenseDate, dan description wajib diisi.');
  }

  const numericAmount = Number(amount);
  const parsedDate = new Date(expenseDate);

  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new Error('amount expense harus angka dan tidak boleh negatif.');
  }

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('expenseDate tidak valid.');
  }
  if (parsedDate > new Date()) {
    throw new Error('expenseDate tidak boleh di masa depan.');
  }

  return {
    category: category.trim(),
    amount: numericAmount,
    expenseDate: parsedDate,
    description: description.trim(),
  };
};

const getExpenses = async (reimbursementId, user) => {
  const parsedReimbursementId = validateId(reimbursementId, 'id reimbursement');
  const reimbursement = await reimbursementModel.findById(parsedReimbursementId, user);
  if (!reimbursement) return null;
  return expenseModel.findByReimbursementId(parsedReimbursementId);
};

const assertEmployeeCanEdit = async (reimbursementId, user) => {
  const reimbursement = await reimbursementModel.findById(reimbursementId, user);
  if (!reimbursement) return null;
  if (user.role !== 'EMPLOYEE' || reimbursement.employeeId !== Number(user.id)) {
    throw new Error('Kamu tidak memiliki akses mengubah expense ini.');
  }
  if (!['DRAFT', 'REVISION_REQUIRED'].includes(reimbursement.status)) {
    throw new Error('Expense hanya bisa diubah saat DRAFT atau REVISION_REQUIRED.');
  }
  return reimbursement;
};

const createExpense = async (reimbursementId, payload, user) => {
  const parsedReimbursementId = validateId(reimbursementId, 'id reimbursement');
  await assertEmployeeCanEdit(parsedReimbursementId, user);
  return expenseModel.create({
    reimbursementId: parsedReimbursementId,
    ...validateExpense(payload),
    receiptUrl: payload.receiptUrl || null,
  });
};

const updateExpense = async (id, payload, user) => {
  const expense = await expenseModel.findById(validateId(id, 'id expense'));
  if (!expense) return null;
  await assertEmployeeCanEdit(expense.reimbursementId, user);
  const data = {};

  if (payload.category !== undefined) data.category = payload.category.trim();
  if (payload.description !== undefined) data.description = payload.description.trim();
  if (payload.receiptUrl !== undefined) data.receiptUrl = payload.receiptUrl || null;
  if (payload.amount !== undefined) {
    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount < 0) throw new Error('amount expense harus angka dan tidak boleh negatif.');
    data.amount = amount;
  }
  if (payload.expenseDate !== undefined) {
    const expenseDate = new Date(payload.expenseDate);
    if (Number.isNaN(expenseDate.getTime())) throw new Error('expenseDate tidak valid.');
    if (expenseDate > new Date()) throw new Error('expenseDate tidak boleh di masa depan.');
    data.expenseDate = expenseDate;
  }

  if (!Object.keys(data).length) throw new Error('tidak ada data expense yang diubah.');

  return expenseModel.updateById(validateId(id, 'id expense'), data);
};

const deleteExpense = async (id, user) => {
  const parsedId = validateId(id, 'id expense');
  const expense = await expenseModel.findById(parsedId);
  if (!expense) return null;
  await assertEmployeeCanEdit(expense.reimbursementId, user);
  return expenseModel.deleteById(parsedId);
};

const updateReceipt = async (id, receiptUrl, user) => {
  const parsedId = validateId(id, 'id expense');
  const expense = await expenseModel.findById(parsedId);
  if (!expense) return null;
  await assertEmployeeCanEdit(expense.reimbursementId, user);
  return expenseModel.updateById(parsedId, { receiptUrl });
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  updateReceipt,
};
