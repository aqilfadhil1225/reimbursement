const reimbursementModel = require('../models/reimbursementModel');
const auditLogModel = require('../models/auditLogModel');

const STATUS = reimbursementModel.STATUS;

const validateReceiptUrl = (receiptUrl) => {
  if (!receiptUrl) return;
  try {
    const url = new URL(receiptUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error('receiptUrl harus berupa URL http atau https yang valid.');
  }
};

const validateExpensesTotal = (expenses, amount) => {
  if (!Array.isArray(expenses) || expenses.length === 0) {
    throw new Error('Minimal satu expense wajib diisi.');
  }
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  if (!expenses.every((expense) => Number.isFinite(Number(expense.amount)) && Number(expense.amount) > 0)) {
    throw new Error('Setiap nominal expense harus lebih besar dari nol.');
  }
  if (Math.abs(total - Number(amount)) > 0.01) {
    throw new Error('Total expense harus sama dengan total reimbursement.');
  }
};

const validateEvidence = (reimbursement) => {
  const hasReimbursementReceipt = Boolean(reimbursement.receiptUrl);
  const hasExpenseReceipt = reimbursement.expenses.some((expense) => Boolean(expense.receiptUrl));

  if (!hasReimbursementReceipt && !hasExpenseReceipt) {
    throw new Error('Minimal satu bukti reimbursement atau bukti expense wajib diunggah.');
  }
};

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

const createReimbursement = async (payload) => {
  const reimbursement = await reimbursementModel.createReimbursement(payload);
  await auditLogModel.create({
    reimbursementId: reimbursement.id,
    actorId: payload.employeeId ? Number(payload.employeeId) : undefined,
    action: 'REIMBURSEMENT_CREATED',
    details: 'Reimbursement dibuat sebagai draft.',
  });
  return reimbursement;
};

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
  if (data.amount !== undefined) data.amount = Number(data.amount);
  if (data.receiptUrl !== undefined) validateReceiptUrl(data.receiptUrl);

  if (data.amount !== undefined && updates.expenses === undefined) {
    validateExpensesTotal(reimbursement.expenses, data.amount);
  }

  if (updates.expenses !== undefined) {
    if (!Array.isArray(updates.expenses)) {
      throw new Error('expenses harus berupa array.');
    }

    data.expenses = updates.expenses;
    validateExpensesTotal(updates.expenses, data.amount ?? reimbursement.amount);
  }

  if (!Object.keys(data).length) throw new Error('tidak ada data reimbursement yang diubah.');

  const updated = await reimbursementModel.updateById(id, data);
  await auditLogModel.create({
    reimbursementId: updated.id,
    actorId: user.id,
    action: 'REIMBURSEMENT_UPDATED',
    details: 'Data reimbursement diperbarui.',
  });
  return updated;
};

const deleteReimbursement = async (id, user) => {
  const reimbursement = await reimbursementModel.findById(id, user);
  if (!reimbursement) return null;
  if (reimbursement.status !== STATUS.DRAFT) {
    throw new Error('Reimbursement hanya bisa dihapus saat DRAFT.');
  }
  const deleted = await reimbursementModel.deleteById(id);
  await auditLogModel.create({
    reimbursementId: deleted.id,
    actorId: user.id,
    action: 'REIMBURSEMENT_DELETED',
    details: 'Draft reimbursement dihapus.',
  });
  return deleted;
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

const submitReimbursement = async (id, actorId, actorRole = 'EMPLOYEE') => {
  const reimbursement = await reimbursementModel.findById(id, { id: actorId, role: actorRole });
  if (!reimbursement) return null;
  validateExpensesTotal(reimbursement.expenses, reimbursement.amount);
  validateEvidence(reimbursement);
  return updateStatus(id, STATUS.SUBMITTED, 'Submitted by employee for manager review.', actorId, undefined, actorRole);
};

const managerReview = async (id, action, note, actorId) => {
  if (!['approve', 'reject', 'revise'].includes(action)) throw new Error('action must be approve, reject, or revise.');
  if (['reject', 'revise'].includes(action) && (!note || !note.trim())) {
    throw new Error('Catatan wajib diisi untuk penolakan atau permintaan revisi.');
  }
  const nextStatus = action === 'approve' ? STATUS.MANAGER_APPROVED : action === 'reject' ? STATUS.REJECTED : STATUS.REVISION_REQUIRED;
  return updateStatus(id, nextStatus, note || `Manager ${action}d the reimbursement.`, actorId, { managerId: actorId ? Number(actorId) : undefined }, 'MANAGER');
};

const financeReview = async (id, action, note, actorId) => {
  if (!['start', 'verify', 'approve', 'reject', 'revise'].includes(action)) throw new Error('action must be start, verify, approve, reject, or revise.');
  if (['reject', 'revise'].includes(action) && (!note || !note.trim())) {
    throw new Error('Catatan wajib diisi untuk penolakan atau permintaan revisi.');
  }
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
