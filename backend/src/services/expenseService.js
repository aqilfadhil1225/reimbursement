const expenseModel = require('../models/expenseModel');

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

const getExpenses = (reimbursementId) => expenseModel.findByReimbursementId(
  validateId(reimbursementId, 'id reimbursement'),
);

const createExpense = (reimbursementId, payload) => expenseModel.create({
  reimbursementId: validateId(reimbursementId, 'id reimbursement'),
  ...validateExpense(payload),
  receiptUrl: payload.receiptUrl || null,
});

const updateExpense = (id, payload) => {
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
    data.expenseDate = expenseDate;
  }

  if (!Object.keys(data).length) throw new Error('tidak ada data expense yang diubah.');

  return expenseModel.updateById(validateId(id, 'id expense'), data);
};

const deleteExpense = (id) => expenseModel.deleteById(validateId(id, 'id expense'));

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
