import apiView from './apiView';

const formatHistory = (history: any) => ({
  id: history.id,
  reimbursementId: history.reimbursementId,
  status: history.status,
  note: history.note,
  actorId: history.actorId,
  createdAt: history.createdAt,
  actor: history.actor ? apiView.formatUser(history.actor) : null,
});

const formatReimbursement = (reimbursement: any) => ({
  id: reimbursement.id,
  employeeName: reimbursement.employeeName,
  employeeEmail: reimbursement.employeeEmail,
  amount: reimbursement.amount,
  category: reimbursement.category,
  description: reimbursement.description,
  receiptUrl: reimbursement.receiptUrl,
  status: reimbursement.status,
  employeeId: reimbursement.employeeId,
  managerId: reimbursement.managerId,
  financeId: reimbursement.financeId,
  createdAt: reimbursement.createdAt,
  updatedAt: reimbursement.updatedAt,
  employee: reimbursement.employee ? apiView.formatUser(reimbursement.employee) : null,
  manager: reimbursement.manager ? apiView.formatUser(reimbursement.manager) : null,
  finance: reimbursement.finance ? apiView.formatUser(reimbursement.finance) : null,
  expenses: (reimbursement.expenses || []).map(apiView.formatExpense),
  history: (reimbursement.history || []).map(formatHistory),
  payment: reimbursement.payment ? apiView.formatPayment(reimbursement.payment) : null,
  notifications: (reimbursement.notifications || []).map(apiView.formatNotification),
  auditLogs: (reimbursement.auditLogs || []).map(apiView.formatAuditLog),
});

const formatReimbursements = (reimbursements: any[]) => reimbursements.map(formatReimbursement);

export default {
  formatReimbursement,
  formatReimbursements,
};
