import express from 'express';
import expenseController from '../controllers/expenseController';
import authorizeRoles from '../middleware/authorizeRoles';
import uploadEvidence from '../middleware/uploadEvidence';

const router = express.Router({ mergeParams: true });

router.get('/', expenseController.listExpenses);
router.post('/', authorizeRoles('EMPLOYEE'), expenseController.createExpense);
router.patch('/:id', authorizeRoles('EMPLOYEE'), expenseController.updateExpense);
router.delete('/:id', authorizeRoles('EMPLOYEE'), expenseController.deleteExpense);
router.post('/:id/receipt', authorizeRoles('EMPLOYEE'), uploadEvidence.single('receipt'), expenseController.uploadReceipt);

export default router;
