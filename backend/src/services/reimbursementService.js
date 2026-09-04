const reimbursementModel = require('../models/reimbursementModel');

const STATUS = reimbursementModel.STATUS;

const canTransition = (currentStatus, nextStatus) => {
  const transitions = {
    [STATUS.DRAFT]: [STATUS.SUBMITTED],
    [STATUS.SUBMITTED]: [STATUS.MANAGER_APPROVED, STATUS.REVISION_REQUIRED, STATUS.REJECTED],
    [STATUS.MANAGER_APPROVED]: [STATUS.FINANCE_REVIEW, STATUS.REVISION_REQUIRED],
    [STATUS.FINANCE_REVIEW]: [STATUS.READY_FOR_PAYMENT, STATUS.REVISION_REQUIRED, STATUS.REJECTED],
    [STATUS.READY_FOR_PAYMENT]: [STATUS.PAID, STATUS.REVISION_REQUIRED],
    [STATUS.REVISION_REQUIRED]: [STATUS.SUBMITTED],
    [STATUS.REJECTED]: [],
    [STATUS.PAID]: [],
  };

  return (transitions[currentStatus] || []).includes(nextStatus);
};

const createReimbursement = (payload) => reimbursementModel.createReimbursement(payload);

const getAllReimbursements = () => reimbursementModel.findAll();

const getReimbursementById = (id) => reimbursementModel.findById(id);

const updateReimbursement = (id, updates) => reimbursementModel.updateById(id, updates);

const deleteReimbursement = (id) => reimbursementModel.deleteById(id);

const updateStatus = async (id, nextStatus, note, actorId, extraData) => {
  const reimbursement = await reimbursementModel.findById(id);

  if (!reimbursement) {
    return null;
  }

  if (!canTransition(reimbursement.status, nextStatus)) {
    return {
      error: `Status transition from ${reimbursement.status} to ${nextStatus} is not allowed.`,
    };
  }

  return reimbursementModel.updateStatus(id, nextStatus, note || `Status changed to ${nextStatus}.`, actorId, extraData);
};

const submitReimbursement = (id, actorId) => updateStatus(id, STATUS.SUBMITTED, 'Submitted by employee for manager review.', actorId);

const managerReview = async (id, action, note, actorId) => {
  if (!['approve', 'reject', 'revise'].includes(action)) throw new Error('action must be approve, reject, or revise.');
  const nextStatus = action === 'approve' ? STATUS.MANAGER_APPROVED : action === 'reject' ? STATUS.REJECTED : STATUS.REVISION_REQUIRED;
  return updateStatus(id, nextStatus, note || `Manager ${action}d the reimbursement.`, actorId, { managerId: actorId ? Number(actorId) : undefined });
};

const financeReview = async (id, action, note, actorId) => {
  if (!['start', 'verify', 'approve', 'reject', 'revise'].includes(action)) throw new Error('action must be start, verify, approve, reject, or revise.');
  const nextStatus = action === 'start' ? STATUS.FINANCE_REVIEW : action === 'verify' || action === 'approve' ? STATUS.READY_FOR_PAYMENT : action === 'reject' ? STATUS.REJECTED : STATUS.REVISION_REQUIRED;
  return updateStatus(id, nextStatus, note || `Finance ${action}d the reimbursement.`, actorId, { financeId: actorId ? Number(actorId) : undefined });
};

const markAsPaid = (id, note, actorId, payment) => reimbursementModel.completePayment(
  id,
  { ...payment, status: 'COMPLETED', paidAt: new Date() },
  actorId,
  note || 'Payment has been processed successfully.',
);

module.exports = {
  STATUS,
  createReimbursement,
  getAllReimbursements,
  getReimbursementById,
  updateReimbursement,
  deleteReimbursement,
  submitReimbursement,
  managerReview,
  financeReview,
  markAsPaid,
  updateStatus,
  findUsers: reimbursementModel.findUsers,
  createUser: reimbursementModel.createUser,
  findNotifications: reimbursementModel.findNotifications,
  markNotificationRead: reimbursementModel.markNotificationRead,
};
