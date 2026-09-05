const express = require('express');
const paymentController = require('../controllers/paymentController');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router({ mergeParams: true });

router.get('/', paymentController.getPayment);
router.post('/', authorizeRoles('FINANCE'), paymentController.completePayment);

module.exports = router;
