const parseCorsOrigins = () => {
  const raw = process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3002,http://localhost:5173';
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

export default {
  port: Number(process.env.PORT) || 3001,
  appName: 'Reimbursement API',
  corsOrigin: parseCorsOrigins(),
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
};
