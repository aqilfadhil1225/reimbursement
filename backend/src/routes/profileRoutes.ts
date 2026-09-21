import express from 'express';
import controller from '../controllers/profileController';

const router = express.Router();

router.get('/', controller.getProfile);
router.patch('/', controller.updateProfile);

export default router;
