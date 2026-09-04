const express = require('express');
const controller = require('../controllers/reimbursementController');

const router = express.Router();

router.get('/', controller.listNotifications);
router.patch('/:id/read', controller.markNotificationRead);

module.exports = router;