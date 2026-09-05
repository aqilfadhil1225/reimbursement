const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

router.get('/', authorizeRoles('MANAGER', 'FINANCE'), auditLogController.listAuditLogs);

module.exports = router;
