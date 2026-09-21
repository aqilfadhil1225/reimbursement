import express from 'express';
import auditLogController from '../controllers/auditLogController';
import authorizeRoles from '../middleware/authorizeRoles';

const router = express.Router();

router.get('/', authorizeRoles('MANAGER', 'FINANCE'), auditLogController.listAuditLogs);

export default router;
