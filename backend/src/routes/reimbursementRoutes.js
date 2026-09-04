const express = require('express');
const reimbursementController = require('../controllers/reimbursementController');

const router = express.Router();

router.get('/', reimbursementController.listReimbursements);
router.post('/', reimbursementController.createReimbursement);
router.get('/:id', reimbursementController.getReimbursement);
router.patch('/:id', reimbursementController.updateReimbursement);
router.delete('/:id', reimbursementController.deleteReimbursement);
router.patch('/:id/submit', reimbursementController.submitReimbursement);
router.patch('/:id/manager', reimbursementController.managerDecision);
router.patch('/:id/finance', reimbursementController.financeDecision);
router.patch('/:id/pay', reimbursementController.markPaid);

module.exports = router;
