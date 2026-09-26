import express from 'express';
import paymentController from '../controllers/paymentController';
import authorizeRoles from '../middleware/authorizeRoles';
import uploadReceipt from '../middleware/uploadReceipt';

const router = express.Router({ mergeParams: true });

router.get('/', paymentController.getPayment);
router.post('/', authorizeRoles('FINANCE'), paymentController.completePayment);
router.post('/proof', authorizeRoles('FINANCE'), uploadReceipt.single('proof'), paymentController.uploadProof);

export default router;
