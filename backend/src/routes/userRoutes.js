const express = require('express');
const controller = require('../controllers/userController');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

router.use(authorizeRoles('FINANCE'));
router.get('/', controller.listUsers);
router.get('/:id', controller.getUser);
router.post('/', controller.createUser);
router.patch('/:id', controller.updateUser);
router.delete('/:id', controller.deleteUser);

module.exports = router;