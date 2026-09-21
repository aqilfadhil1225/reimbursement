import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import config from '../config';

interface AuthenticatedRequest extends Request {
  user?: any;
}

const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  const token = authorization && authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token login wajib dikirim.' });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token login tidak valid atau sudah kedaluwarsa.' });
  }
};

export default authenticate;
