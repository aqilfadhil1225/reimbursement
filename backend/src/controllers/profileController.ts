import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import userService from '../services/userService';
import apiView from '../views/apiView';

const createToken = (user: any) => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  config.jwtSecret,
  { expiresIn: '1d' },
);

const getProfile: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any };
    const user = await userService.getUserById(authReq.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }
    return res.json({ success: true, data: apiView.formatUser(user) });
  } catch (error) {
    return next(error);
  }
};

const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; body: Record<string, any> };
    const user = await userService.updateUser(authReq.user.id, {
      name: authReq.body.name,
      email: authReq.body.email,
    });
    return res.json({
      success: true,
      data: {
        user: apiView.formatUser(user),
        token: createToken(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export default {
  getProfile,
  updateProfile,
};
