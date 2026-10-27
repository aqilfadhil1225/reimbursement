import { Request, Response } from 'express';
import authModel from '../models/authModel';
import authService from '../services/authService';
import apiView from '../views/apiView';

const SESSION_COOKIE = 'reimbursement_session';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

const setSessionCookie = (res: Response, token: string) => {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
};

const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

const sendAuthenticatedUser = (res: Response, result: { user: any; token: string }, status = 200) => {
  setSessionCookie(res, result.token);
  return res.status(status).json({ success: true, data: { user: result.user } });
};

const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    return sendAuthenticatedUser(res, result, 201);
  } catch (error: any) {
    return res.status(error.code === 'P2002' ? 409 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    return sendAuthenticatedUser(res, result);
  } catch (error: any) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

const loginWithGoogle = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginWithGoogle(req.body?.credential);
    return sendAuthenticatedUser(res, result);
  } catch (error: any) {
    return res.status(error.statusCode || (error.code === 'P2002' ? 409 : 401)).json({
      success: false,
      message: error.message || 'Login dengan Google gagal.',
    });
  }
};

const session = async (req: Request, res: Response) => {
  const authReq = req as Request & { user?: { id: number } };
  const userId = authReq.user?.id;
  if (typeof userId !== 'number' || !Number.isInteger(userId)) {
    clearSessionCookie(res);
    return res.status(401).json({ success: false, message: 'Sesi login tidak valid.' });
  }

  const user = await authModel.findUserById(userId);
  if (!user) {
    clearSessionCookie(res);
    return res.status(401).json({ success: false, message: 'Sesi login tidak valid.' });
  }

  return res.json({ success: true, data: { user: await apiView.formatUser(user) } });
};

const logout = (_req: Request, res: Response) => {
  clearSessionCookie(res);
  return res.json({ success: true, data: { message: 'Sesi berhasil diakhiri.' } });
};

export default {
  register,
  login,
  loginWithGoogle,
  session,
  logout,
};
