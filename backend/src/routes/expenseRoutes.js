const express = require('express');
const expenseController = require('../controllers/expenseController');
const authorizeRoles = require('../middleware/authorizeRoles');
const uploadReceipt = require('../middleware/uploadReceipt');

const router = express.Router({ mergeParams: true });

router.get('/', expenseController.listExpenses);
router.post('/', authorizeRoles('EMPLOYEE'), expenseController.createExpense);
router.patch('/:id', authorizeRoles('EMPLOYEE'), expenseController.updateExpense);
router.delete('/:id', authorizeRoles('EMPLOYEE'), expenseController.deleteExpense);
router.post('/:id/receipt', authorizeRoles('EMPLOYEE'), uploadReceipt.single('receipt'), expenseController.uploadReceipt);

module.exports = router;
