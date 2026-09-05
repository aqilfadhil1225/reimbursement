const express = require('express');
const cors = require('cors');
const config = require('./config');
const reimbursementRoutes = require('./routes/reimbursementRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Reimbursement API is running.',
    app: config.appName,
  });
});

app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const statusByCode = {
    P2002: 409,
    P2025: 404,
  };
  const status = statusByCode[err.code] || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal Server Error' : err.message,
  });
});

module.exports = app;
