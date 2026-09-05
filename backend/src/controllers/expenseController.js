const expenseService = require('../services/expenseService');

const listExpenses = async (req, res, next) => {
  try {
    const expenses = await expenseService.getExpenses(req.params.reimbursementId);
    return res.json({ success: true, data: expenses });
  } catch (error) {
    return next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(req.params.reimbursementId, req.body);
    return res.status(201).json({ success: true, data: expense });
  } catch (error) {
    return next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body);
    return res.json({ success: true, data: expense });
  } catch (error) {
    return next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
