import { NextFunction, Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    role?: string;
  };
}

const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role || '')) {
      return res.status(403).json({
        success: false,
        message: 'Kamu tidak punya akses untuk aksi ini.',
      });
    }

    return next();
  };
};

export default authorizeRoles;
