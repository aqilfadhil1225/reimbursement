import express from 'express';
import controller from '../controllers/userController';
import authorizeRoles from '../middleware/authorizeRoles';

const router = express.Router();

router.use(authorizeRoles('FINANCE'));
router.get('/', controller.listUsers);
router.get('/:id', controller.getUser);
router.post('/', controller.createUser);
router.patch('/:id', controller.updateUser);
router.delete('/:id', controller.deleteUser);

export default router;
