const express = require('express');
const reimbursementController = require('../controllers/reimbursementController');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

router.get('/', reimbursementController.listReimbursements);
router.post('/', authorizeRoles('EMPLOYEE'), reimbursementController.createReimbursement);
router.get('/:id', reimbursementController.getReimbursement);
router.patch('/:id', authorizeRoles('EMPLOYEE'), reimbursementController.updateReimbursement);
router.delete('/:id', authorizeRoles('EMPLOYEE'), reimbursementController.deleteReimbursement);
router.patch('/:id/submit', authorizeRoles('EMPLOYEE'), reimbursementController.submitReimbursement);
router.patch('/:id/manager', authorizeRoles('MANAGER'), reimbursementController.managerDecision);
router.patch('/:id/finance', authorizeRoles('FINANCE'), reimbursementController.financeDecision);
router.patch('/:id/pay', authorizeRoles('FINANCE'), reimbursementController.markPaid);

module.exports = router;
