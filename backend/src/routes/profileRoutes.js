const express = require('express');
const controller = require('../controllers/profileController');

const router = express.Router();

router.get('/', controller.getProfile);
router.patch('/', controller.updateProfile);

module.exports = router;
