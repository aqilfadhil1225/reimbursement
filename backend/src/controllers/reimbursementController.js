const reimbursementService = require('../services/reimbursementService');
const reimbursementView = require('../views/reimbursementView');

const listReimbursements = async (req, res, next) => {
  try {
    const reimbursements = await reimbursementService.getAllReimbursements(req.user);
  return res.json({
    success: true,
    data: reimbursementView.formatReimbursements(reimbursements),
  });
  } catch (error) {
    next(error);
  }
};

const getReimbursement = async (req, res, next) => {
  try {
    const reimbursement = await reimbursementService.getReimbursementById(req.params.id, req.user);

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
    const reimbursement = await reimbursementService.updateReimbursement(req.params.id, req.body, req.user);
    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    }
    return res.json({ success: true, data: reimbursementView.formatReimbursement(reimbursement) });
  } catch (error) {
    return next(error);
  }
};

const deleteReimbursement = async (req, res, next) => {
  try {
    const reimbursement = await reimbursementService.deleteReimbursement(req.params.id, req.user);
    if (!reimbursement) {
      return res.status(404).json({ success: false, message: 'Reimbursement tidak ditemukan.' });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const createReimbursement = async (req, res) => {
  try {
    const reimbursement = await reimbursementService.createReimbursement({
      ...req.body,
      employeeId: req.user.id,
      employeeName: req.user.name,
      employeeEmail: req.user.email,
      managerId: undefined,
      financeId: undefined,
      status: 'DRAFT',
    });

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

module.exports = {
  listReimbursements,
  getReimbursement,
  updateReimbursement,
  deleteReimbursement,
  createReimbursement,
  submitReimbursement,
  managerDecision,
  financeDecision,
};
