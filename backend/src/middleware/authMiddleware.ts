import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { isTrustedOrigin } from './requireTrustedOrigin';

interface AuthenticatedRequest extends Request {
  user?: any;
}

const getSessionToken = (req: Request) => {
  const sessionCookie = req.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('reimbursement_session='));

  return sessionCookie?.slice('reimbursement_session='.length);
};

const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = getSessionToken(req);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Sesi login wajib tersedia.' });
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (!isTrustedOrigin(req.get('origin'))) {
      return res.status(403).json({ success: false, message: 'Origin request tidak diizinkan.' });
    }
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Sesi login tidak valid atau sudah kedaluwarsa.' });
  }
};

export default authenticate;
