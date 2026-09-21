import express from 'express';
import reimbursementController from '../controllers/reimbursementController';
import authorizeRoles from '../middleware/authorizeRoles';
import uploadReceipt from '../middleware/uploadReceipt';

const router = express.Router();

router.get('/', reimbursementController.listReimbursements);
router.post('/', authorizeRoles('EMPLOYEE'), reimbursementController.createReimbursement);
router.get('/:id', reimbursementController.getReimbursement);
router.patch('/:id', authorizeRoles('EMPLOYEE'), reimbursementController.updateReimbursement);
router.delete('/:id', authorizeRoles('EMPLOYEE'), reimbursementController.deleteReimbursement);
router.patch('/:id/submit', authorizeRoles('EMPLOYEE'), reimbursementController.submitReimbursement);
router.patch('/:id/manager', authorizeRoles('MANAGER'), reimbursementController.managerDecision);
router.patch('/:id/finance', authorizeRoles('FINANCE'), reimbursementController.financeDecision);
router.post('/:id/receipt', authorizeRoles('EMPLOYEE'), uploadReceipt.single('receipt'), reimbursementController.uploadReceipt);

export default router;
