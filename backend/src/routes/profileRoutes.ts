import express from 'express';
import controller from '../controllers/profileController';
import uploadProfilePhoto from '../middleware/uploadProfilePhoto';

const router = express.Router();

router.get('/', controller.getProfile);
router.post('/google', controller.linkGoogleAccount);
router.delete('/google', controller.unlinkGoogleAccount);
router.patch('/', uploadProfilePhoto.single('avatar'), controller.updateProfile);

export default router;
