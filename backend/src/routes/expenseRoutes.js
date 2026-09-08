const express = require('express');
const expenseController = require('../controllers/expenseController');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router({ mergeParams: true });

router.get('/', expenseController.listExpenses);
router.post('/', authorizeRoles('EMPLOYEE'), expenseController.createExpense);
router.patch('/:id', authorizeRoles('EMPLOYEE'), expenseController.updateExpense);
router.delete('/:id', authorizeRoles('EMPLOYEE'), expenseController.deleteExpense);

module.exports = router;
