import { RequestHandler } from 'express';
import fs from 'fs/promises';
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
  let uploadedPhoto: Express.Multer.File | undefined;
  try {
    const authReq = req as typeof req & {
      user?: any;
      body: Record<string, any>;
      file?: Express.Multer.File;
      protocol: string;
      get: (header: string) => string;
    };
    const updatePayload: Record<string, any> = {};
    uploadedPhoto = authReq.file;

    if (authReq.body.name !== undefined) {
      updatePayload.name = authReq.body.name;
    }

    if (uploadedPhoto) {
      const contents = await fs.readFile(uploadedPhoto.path);
      const isJpeg = contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff;
      const isPng = contents.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      const isWebp = contents.toString('ascii', 0, 4) === 'RIFF' && contents.toString('ascii', 8, 12) === 'WEBP';
      const matchesMimeType =
        (uploadedPhoto.mimetype === 'image/jpeg' && isJpeg)
        || (uploadedPhoto.mimetype === 'image/png' && isPng)
        || (uploadedPhoto.mimetype === 'image/webp' && isWebp);

      if (!matchesMimeType) {
        throw Object.assign(new Error('Isi file tidak sesuai dengan format foto yang dipilih.'), { statusCode: 400 });
      }

      updatePayload.avatarUrl = `${authReq.protocol}://${authReq.get('host')}/uploads/${uploadedPhoto.filename}`;
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
    if (uploadedPhoto) {
      try {
        await fs.unlink(uploadedPhoto.path);
      } catch (cleanupError) {
        console.error('Failed to remove an uncommitted profile photo:', cleanupError);
      }
    }
    return next(error);
  }
};

export default {
  getProfile,
  updateProfile,
};
