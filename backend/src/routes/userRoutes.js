const express = require('express');
const controller = require('../controllers/reimbursementController');

const router = express.Router();

router.get('/', controller.listUsers);
router.post('/', controller.createUser);

module.exports = router;