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

const getAllReimbursements = (user) => reimbursementModel.findAll(user);

const getReimbursementById = (id, user) => reimbursementModel.findById(id, user);

const updateReimbursement = async (id, updates, user) => {
  const reimbursement = await reimbursementModel.findById(id, user);
  if (!reimbursement) return null;
  if (reimbursement.status !== STATUS.DRAFT && reimbursement.status !== STATUS.REVISION_REQUIRED) {
    throw new Error('Reimbursement hanya bisa diubah saat DRAFT atau REVISION_REQUIRED.');
  }
  const allowedFields = [
    'employeeName',
    'employeeEmail',
    'amount',
    'category',
    'description',
    'receiptUrl',
  ];
  const data = Object.fromEntries(
    allowedFields
      .filter((field) => updates[field] !== undefined)
      .map((field) => [field, updates[field]]),
  );

  if (data.amount !== undefined && (!Number.isFinite(Number(data.amount)) || Number(data.amount) < 0)) {
    throw new Error('amount harus berupa angka dan tidak boleh negatif.');
  }
  if (!Object.keys(data).length) throw new Error('tidak ada data reimbursement yang diubah.');
  if (data.amount !== undefined) data.amount = Number(data.amount);

  return reimbursementModel.updateById(id, data);
};

const deleteReimbursement = async (id, user) => {
  const reimbursement = await reimbursementModel.findById(id, user);
  if (!reimbursement) return null;
  if (reimbursement.status !== STATUS.DRAFT) {
    throw new Error('Reimbursement hanya bisa dihapus saat DRAFT.');
  }
  return reimbursementModel.deleteById(id);
};

const updateStatus = async (id, nextStatus, note, actorId, extraData, actorRole) => {
  const normalizedStatus = reimbursementModel.normalizeStatus
    ? reimbursementModel.normalizeStatus(nextStatus)
    : nextStatus;
  const reimbursement = await reimbursementModel.findById(id, { id: actorId, role: actorRole });

  if (!reimbursement) {
    return null;
  }

  if (!canTransition(reimbursement.status, normalizedStatus)) {
    return {
      error: `Perubahan status dari ${reimbursement.status} ke ${normalizedStatus} tidak diizinkan.`,
    };
  }

  return reimbursementModel.updateStatus(
    id,
    normalizedStatus,
    note || `Status reimbursement diubah menjadi ${normalizedStatus}.`,
    actorId,
    extraData,
  );
};

const submitReimbursement = (id, actorId, actorRole = 'EMPLOYEE') => updateStatus(id, STATUS.SUBMITTED, 'Submitted by employee for manager review.', actorId, undefined, actorRole);

const managerReview = async (id, action, note, actorId) => {
  if (!['approve', 'reject', 'revise'].includes(action)) throw new Error('action must be approve, reject, or revise.');
  const nextStatus = action === 'approve' ? STATUS.MANAGER_APPROVED : action === 'reject' ? STATUS.REJECTED : STATUS.REVISION_REQUIRED;
  return updateStatus(id, nextStatus, note || `Manager ${action}d the reimbursement.`, actorId, { managerId: actorId ? Number(actorId) : undefined }, 'MANAGER');
};

const financeReview = async (id, action, note, actorId) => {
  if (!['start', 'verify', 'approve', 'reject', 'revise'].includes(action)) throw new Error('action must be start, verify, approve, reject, or revise.');
  const nextStatus = action === 'start' ? STATUS.FINANCE_REVIEW : action === 'verify' || action === 'approve' ? STATUS.READY_FOR_PAYMENT : action === 'reject' ? STATUS.REJECTED : STATUS.REVISION_REQUIRED;
  return updateStatus(id, nextStatus, note || `Finance ${action}d the reimbursement.`, actorId, { financeId: actorId ? Number(actorId) : undefined }, 'FINANCE');
};

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
  updateStatus,
};
