import apiView from './apiView';

const formatHistory = async (history: any) => ({
  id: history.id,
  reimbursementId: history.reimbursementId,
  status: history.status,
  note: history.note,
  actorId: history.actorId,
  createdAt: history.createdAt,
  actor: history.actor ? await apiView.formatUser(history.actor) : null,
});

const formatReimbursement = async (reimbursement: any) => {
  const [employee, manager, finance, history] = await Promise.all([
    reimbursement.employee ? apiView.formatUser(reimbursement.employee) : null,
    reimbursement.manager ? apiView.formatUser(reimbursement.manager) : null,
    reimbursement.finance ? apiView.formatUser(reimbursement.finance) : null,
    Promise.all((reimbursement.history || []).map(formatHistory)),
  ]);

  return {
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
    employee,
    manager,
    finance,
    expenses: (reimbursement.expenses || []).map(apiView.formatExpense),
    history,
    payment: reimbursement.payment ? apiView.formatPayment(reimbursement.payment) : null,
    notifications: (reimbursement.notifications || []).map(apiView.formatNotification),
    auditLogs: (reimbursement.auditLogs || []).map(apiView.formatAuditLog),
  };
};

const formatReimbursements = (reimbursements: any[]) => Promise.all(reimbursements.map(formatReimbursement));

export default {
  formatReimbursement,
  formatReimbursements,
};
