const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router({ mergeParams: true });

router.get('/', paymentController.getPayment);
router.post('/', paymentController.completePayment);

module.exports = router;
