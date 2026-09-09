const expenseModel = require('../models/expenseModel');
const reimbursementModel = require('../models/reimbursementModel');
const auditLogModel = require('../models/auditLogModel');

const validateId = (id, label) => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new Error(`${label} tidak valid.`);
  }

  return parsedId;
};

const validateReceiptUrl = (receiptUrl) => {
  if (!receiptUrl) return null;
  try {
    const url = new URL(receiptUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error('receiptUrl harus berupa URL http atau https yang valid.');
  }
  return receiptUrl.trim();
};

const validateExpense = ({ category, amount, expenseDate, description }) => {
  if (!category || amount === undefined || amount === null || !expenseDate || !description) {
    throw new Error('category, amount, expenseDate, dan description wajib diisi.');
  }

  const numericAmount = Number(amount);
  const parsedDate = new Date(expenseDate);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('amount expense harus angka dan lebih besar dari nol.');
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

const validateReimbursementTotal = (reimbursement, expenses) => {
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  if (!expenses.length || Math.abs(total - Number(reimbursement.amount)) > 0.01) {
    throw new Error('Total expense harus sama dengan total reimbursement.');
  }
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
  const reimbursement = await assertEmployeeCanEdit(parsedReimbursementId, user);
  if (!reimbursement) return null;
  const expenseData = {
    reimbursementId: parsedReimbursementId,
    ...validateExpense(payload),
    receiptUrl: validateReceiptUrl(payload.receiptUrl) || null,
  };
  const currentExpenses = await expenseModel.findByReimbursementId(parsedReimbursementId);
  validateReimbursementTotal(reimbursement, [...currentExpenses, expenseData]);
  const expense = await expenseModel.create(expenseData);
  await auditLogModel.create({
    reimbursementId: parsedReimbursementId,
    actorId: user.id,
    action: 'EXPENSE_CREATED',
    details: `Expense ${expense.id} ditambahkan.`,
  });
  return expense;
};

const updateExpense = async (id, payload, user) => {
  const expense = await expenseModel.findById(validateId(id, 'id expense'));
  if (!expense) return null;
  const reimbursement = await assertEmployeeCanEdit(expense.reimbursementId, user);
  if (!reimbursement) return null;
  const data = {};

  if (payload.category !== undefined) data.category = payload.category.trim();
  if (payload.description !== undefined) data.description = payload.description.trim();
  if (payload.receiptUrl !== undefined) data.receiptUrl = validateReceiptUrl(payload.receiptUrl);
  if (payload.amount !== undefined) {
    const amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount expense harus angka dan lebih besar dari nol.');
    data.amount = amount;
  }
  if (payload.expenseDate !== undefined) {
    const expenseDate = new Date(payload.expenseDate);
    if (Number.isNaN(expenseDate.getTime())) throw new Error('expenseDate tidak valid.');
    if (expenseDate > new Date()) throw new Error('expenseDate tidak boleh di masa depan.');
    data.expenseDate = expenseDate;
  }

  if (!Object.keys(data).length) throw new Error('tidak ada data expense yang diubah.');

  const currentExpenses = await expenseModel.findByReimbursementId(expense.reimbursementId);
  const nextExpenses = currentExpenses.map((currentExpense) => (
    currentExpense.id === expense.id ? { ...currentExpense, ...data } : currentExpense
  ));
  validateReimbursementTotal(reimbursement, nextExpenses);
  const updated = await expenseModel.updateById(validateId(id, 'id expense'), data);
  await auditLogModel.create({
    reimbursementId: expense.reimbursementId,
    actorId: user.id,
    action: 'EXPENSE_UPDATED',
    details: `Expense ${expense.id} diperbarui.`,
  });
  return updated;
};

const deleteExpense = async (id, user) => {
  const parsedId = validateId(id, 'id expense');
  const expense = await expenseModel.findById(parsedId);
  if (!expense) return null;
  const reimbursement = await assertEmployeeCanEdit(expense.reimbursementId, user);
  if (!reimbursement) return null;
  const currentExpenses = await expenseModel.findByReimbursementId(expense.reimbursementId);
  validateReimbursementTotal(
    reimbursement,
    currentExpenses.filter((currentExpense) => currentExpense.id !== parsedId),
  );
  const deleted = await expenseModel.deleteById(parsedId);
  await auditLogModel.create({
    reimbursementId: expense.reimbursementId,
    actorId: user.id,
    action: 'EXPENSE_DELETED',
    details: `Expense ${expense.id} dihapus.`,
  });
  return deleted;
};

const updateReceipt = async (id, receiptUrl, user) => {
  const parsedId = validateId(id, 'id expense');
  const expense = await expenseModel.findById(parsedId);
  if (!expense) return null;
  const reimbursement = await assertEmployeeCanEdit(expense.reimbursementId, user);
  if (!reimbursement) return null;
  const updated = await expenseModel.updateById(parsedId, { receiptUrl: validateReceiptUrl(receiptUrl) });
  await auditLogModel.create({
    reimbursementId: expense.reimbursementId,
    actorId: user.id,
    action: 'EXPENSE_RECEIPT_UPLOADED',
    details: `Bukti expense ${expense.id} diunggah.`,
  });
  return updated;
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  updateReceipt,
};
