const express = require('express');
const cors = require('cors');
const config = require('./config');
const reimbursementRoutes = require('./routes/reimbursementRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
const authenticate = require('./middleware/authMiddleware');
const path = require('path');

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Reimbursement API is running.',
    app: config.appName,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/reimbursements', authenticate, reimbursementRoutes);
app.use('/api/reimbursements/:reimbursementId/expenses', authenticate, expenseRoutes);
app.use('/api/reimbursements/:reimbursementId/payment', authenticate, paymentRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/audit-logs', authenticate, auditLogRoutes);
app.use('/api/reports', authenticate, reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const statusByCode = {
    P2002: 409,
    P2025: 404,
    LIMIT_FILE_SIZE: 400,
  };
  const status = statusByCode[err.code] || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal Server Error' : err.message,
  });
});

module.exports = app;
