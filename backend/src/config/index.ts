export default {
  port: Number(process.env.PORT) || 3000,
  appName: 'Reimbursement API',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
};
