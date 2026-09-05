const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const formatExpense = (expense) => ({
  id: expense.id,
  reimbursementId: expense.reimbursementId,
  category: expense.category,
  amount: expense.amount,
  expenseDate: expense.expenseDate,
  description: expense.description,
  receiptUrl: expense.receiptUrl,
  createdAt: expense.createdAt,
});

const formatPayment = (payment) => ({
  id: payment.id,
  reimbursementId: payment.reimbursementId,
  amount: payment.amount,
  method: payment.method,
  status: payment.status,
  reference: payment.reference,
  paidAt: payment.paidAt,
  createdAt: payment.createdAt,
});

const formatNotification = (notification) => ({
  id: notification.id,
  userId: notification.userId,
  reimbursementId: notification.reimbursementId,
  title: notification.title,
  message: notification.message,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
  reimbursement: notification.reimbursement || null,
});

const formatAuditLog = (auditLog) => ({
  id: auditLog.id,
  actorId: auditLog.actorId,
  reimbursementId: auditLog.reimbursementId,
  action: auditLog.action,
  details: auditLog.details,
  createdAt: auditLog.createdAt,
  actor: auditLog.actor || null,
  reimbursement: auditLog.reimbursement || null,
});

module.exports = {
  formatUser,
  formatExpense,
  formatPayment,
  formatNotification,
  formatAuditLog,
};
