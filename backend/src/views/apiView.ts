import objectStorageService from '../services/objectStorageService';

const formatUser = async (user: any) => {
  let avatarUrl = user.avatarUrl ?? null;
  if (avatarUrl && objectStorageService.isProfilePhotoObjectKey(avatarUrl, user.id)) {
    avatarUrl = await objectStorageService.createObjectUrl(avatarUrl, 24 * 60 * 60);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl,
    googleLinked: Boolean(user.googleId),
    hasLocalPassword: user.hasLocalPassword ?? true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const formatExpense = async (expense: any) => ({
  id: expense.id,
  reimbursementId: expense.reimbursementId,
  category: expense.category,
  amount: expense.amount,
  expenseDate: expense.expenseDate,
  description: expense.description,
  receiptUrl: await objectStorageService.formatReceiptUrl(expense.receiptUrl),
  createdAt: expense.createdAt,
});

const formatPayment = (payment: any) => ({
  id: payment.id,
  reimbursementId: payment.reimbursementId,
  amount: payment.amount,
  method: payment.method,
  status: payment.status,
  reference: payment.reference,
  proofUrl: payment.proofUrl,
  paidAt: payment.paidAt,
  createdAt: payment.createdAt,
});

const formatNotification = (notification: any) => ({
  id: notification.id,
  userId: notification.userId,
  reimbursementId: notification.reimbursementId,
  title: notification.title,
  message: notification.message,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
  reimbursement: notification.reimbursement || null,
});

const formatAuditLog = (auditLog: any) => ({
  id: auditLog.id,
  actorId: auditLog.actorId,
  reimbursementId: auditLog.reimbursementId,
  action: auditLog.action,
  details: auditLog.details,
  createdAt: auditLog.createdAt,
  actor: auditLog.actor || null,
  reimbursement: auditLog.reimbursement || null,
});

export default {
  formatUser,
  formatExpense,
  formatPayment,
  formatNotification,
  formatAuditLog,
};
