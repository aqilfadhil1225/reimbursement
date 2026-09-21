import express from 'express';
import paymentController from '../controllers/paymentController';
import authorizeRoles from '../middleware/authorizeRoles';

const router = express.Router({ mergeParams: true });

router.get('/', paymentController.getPayment);
router.post('/', authorizeRoles('FINANCE'), paymentController.completePayment);

export default router;
