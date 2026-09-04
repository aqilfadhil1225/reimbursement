const formatReimbursement = (reimbursement) => ({
  ...reimbursement,
  history: reimbursement.history || [],
});

const formatReimbursements = (reimbursements) => reimbursements.map(formatReimbursement);

module.exports = {
  formatReimbursement,
  formatReimbursements,
};
