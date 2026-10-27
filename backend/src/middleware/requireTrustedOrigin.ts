import { NextFunction, Request, Response } from 'express';
import config from '../config';

export const isTrustedOrigin = (origin: string | undefined) =>
  Boolean(origin && config.corsOrigin.includes(origin));

const requireTrustedOrigin = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.get('origin');
  if (!isTrustedOrigin(origin)) {
    return res.status(403).json({ success: false, message: 'Origin request tidak diizinkan.' });
  }

  return next();
};

export default requireTrustedOrigin;
