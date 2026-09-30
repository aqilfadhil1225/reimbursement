import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import config from './config';
import openApiDocument from './docs/openapi';
import reimbursementRoutes from './routes/reimbursementRoutes';
import expenseRoutes from './routes/expenseRoutes';
import paymentRoutes from './routes/paymentRoutes';
import userRoutes from './routes/userRoutes';
import notificationRoutes from './routes/notificationRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import reportRoutes from './routes/reportRoutes';
import profileRoutes from './routes/profileRoutes';
import authRoutes from './routes/authRoutes';
import authenticate from './middleware/authMiddleware';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = config.corsOrigin as string[];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Reimbursement API is running.',
    app: config.appName,
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use('/api/auth', authRoutes);
app.use('/api/reimbursements', authenticate, reimbursementRoutes);
app.use('/api/reimbursements/:reimbursementId/expenses', authenticate, expenseRoutes);
app.use('/api/reimbursements/:reimbursementId/payment', authenticate, paymentRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/audit-logs', authenticate, auditLogRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/profile', authenticate, profileRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  const statusByCode: Record<string, number> = {
    P2002: 409,
    P2025: 404,
    LIMIT_FILE_SIZE: 400,
  };

  const isOperationalError = err instanceof Error && !!err.message;
  const status =
    statusByCode[err.code]
    || err.statusCode
    || (err.name === 'MulterError' ? 400 : 500);

  res.status(status).json({
    success: false,
    message: isOperationalError && status < 500 ? err.message : (status === 500 ? 'Internal Server Error' : err.message || 'Terjadi kesalahan pada server.'),
  });
});

export default app;
