import express from 'express';
import reportController from '../controllers/reportController';

const router = express.Router();

router.get('/summary', reportController.getSummary);

export default router;
