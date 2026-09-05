const express = require('express');
const expenseController = require('../controllers/expenseController');

const router = express.Router({ mergeParams: true });

router.get('/', expenseController.listExpenses);
router.post('/', expenseController.createExpense);
router.patch('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
