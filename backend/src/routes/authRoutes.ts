import express from 'express';
import authController from '../controllers/authController';
import authenticate from '../middleware/authMiddleware';
import authRateLimit from '../middleware/authRateLimit';
import requireTrustedOrigin from '../middleware/requireTrustedOrigin';

const router = express.Router();

router.post('/register', requireTrustedOrigin, authRateLimit, authController.register);
router.post('/login', requireTrustedOrigin, authRateLimit, authController.login);
router.post('/google', requireTrustedOrigin, authRateLimit, authController.loginWithGoogle);
router.get('/session', authenticate, authController.session);
router.post('/logout', requireTrustedOrigin, authController.logout);

export default router;
