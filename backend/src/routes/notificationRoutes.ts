import express from 'express';
import controller from '../controllers/notificationController';

const router = express.Router();

router.get('/', controller.listNotifications);
router.patch('/:id/read', controller.markNotificationRead);

export default router;
