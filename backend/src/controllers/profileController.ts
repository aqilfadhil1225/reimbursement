import { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
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
    const updatePayload: Record<string, any> = {};

    if (authReq.body.name !== undefined) {
      updatePayload.name = authReq.body.name;
    }

    if (authReq.body.email !== undefined) {
      updatePayload.email = authReq.body.email;
    }

    if (authReq.body.password !== undefined) {
      const currentPassword = authReq.body.currentPassword;
      if (typeof currentPassword !== 'string' || !currentPassword.trim()) {
        throw new Error('password lama wajib diisi.');
      }

      if (typeof authReq.body.password !== 'string' || authReq.body.password.length < 6) {
        throw new Error('password minimal 6 karakter.');
      }

      const currentUser = await userService.getUserById(authReq.user.id);
      const passwordMatches = currentUser && await bcrypt.compare(currentPassword, currentUser.password);

      if (!passwordMatches) {
        throw new Error('password lama salah.');
      }

      updatePayload.password = authReq.body.password;
    }

    const user = await userService.updateUser(authReq.user.id, updatePayload);
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
