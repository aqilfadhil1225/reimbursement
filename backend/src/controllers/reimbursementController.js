const reimbursementService = require('../services/reimbursementService');
const reimbursementView = require('../views/reimbursementView');

const listReimbursements = async (req, res, next) => {
  try {
    const reimbursements = await reimbursementService.getAllReimbursements();
  res.json({
    success: true,
    data: reimbursementView.formatReimbursements(reimbursements),
  });
  } catch (error) {
    next(error);
  }
};

const getReimbursement = async (req, res, next) => {
  try {
    const reimbursement = await reimbursementService.getReimbursementById(req.params.id);

  if (!reimbursement) {
    return res.status(404).json({ success: false, message: 'Reimbursement not found.' });
  }

    return res.json({ success: true, data: reimbursementView.formatReimbursement(reimbursement) });
  } catch (error) {
    return next(error);
  }
};

const updateReimbursement = async (req, res, next) => {
  try {
    const reimbursement = await reimbursementService.updateReimbursement(req.params.id, req.body);
    return res.json({ success: true, data: reimbursementView.formatReimbursement(reimbursement) });
  } catch (error) {
    return next(error);
  }
};

const deleteReimbursement = async (req, res, next) => {
  try {
    await reimbursementService.deleteReimbursement(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const createReimbursement = async (req, res) => {
  try {
    const reimbursement = await reimbursementService.createReimbursement(req.body);

    return res.status(201).json({
      success: true,
      data: reimbursementView.formatReimbursement(reimbursement),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const submitReimbursement = async (req, res, next) => {
  try {
  const result = await reimbursementService.submitReimbursement(req.params.id, req.user.id);

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

const managerDecision = async (req, res, next) => {
  const { action, note } = req.body;
  try {
  const result = await reimbursementService.managerReview(req.params.id, action, note, req.user.id);

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

const financeDecision = async (req, res, next) => {
  const { action, note } = req.body;
  try {
  const result = await reimbursementService.financeReview(req.params.id, action, note, req.user.id);

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

const markPaid = async (req, res, next) => {
  const { note, method = 'BANK_TRANSFER', reference } = req.body;
  try {
  const result = await reimbursementService.markAsPaid(req.params.id, note, req.user.id, { method, reference });

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

const listUsers = async (req, res, next) => {
  try {
    const users = await reimbursementService.findUsers(req.query.role);
    return res.json({ success: true, data: users });
  } catch (error) {
    return next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await reimbursementService.createUser(req.body);
    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
};

const listNotifications = async (req, res, next) => {
  try {
    const notifications = await reimbursementService.findNotifications(req.query.userId);
    return res.json({ success: true, data: notifications });
  } catch (error) {
    return next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await reimbursementService.markNotificationRead(req.params.id);
    return res.json({ success: true, data: notification });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listReimbursements,
  getReimbursement,
  updateReimbursement,
  deleteReimbursement,
  createReimbursement,
  submitReimbursement,
  managerDecision,
  financeDecision,
  markPaid,
  listUsers,
  createUser,
  listNotifications,
  markNotificationRead,
};
