import { RequestHandler } from 'express';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';
import userService from '../services/userService';
import authService from '../services/authService';
import apiView from '../views/apiView';

const createToken = (user: any) => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  config.jwtSecret,
  { expiresIn: '1d' },
);

const removeStoredProfilePhoto = async (avatarUrl: unknown) => {
  if (typeof avatarUrl !== 'string') return;

  let filename: string;
  try {
    filename = path.basename(new URL(avatarUrl).pathname);
  } catch {
    return;
  }

  if (!/^profile-\d+-[a-f0-9]+\.(jpg|png|webp)$/.test(filename)) return;

  try {
    await fs.unlink(path.join(__dirname, '../../uploads', filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Failed to remove the previous profile photo:', error);
    }
  }
};

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

const linkGoogleAccount: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; body: Record<string, any> };
    const googleProfile = await authService.verifyGoogleCredential(authReq.body?.credential);
    const user = await userService.getUserById(authReq.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    if (googleProfile.email?.trim().toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Email Google harus sama dengan email akun yang sedang digunakan.' });
    }
    if (user.googleId && user.googleId !== googleProfile.sub) {
      return res.status(409).json({ success: false, message: 'Akun Google lain sudah terhubung.' });
    }

    const updatedUser = await userService.linkGoogleAccount(user.id, googleProfile.sub);
    return res.json({ success: true, data: apiView.formatUser(updatedUser) });
  } catch (error) {
    return next(error);
  }
};

const unlinkGoogleAccount: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any };
    const user = await userService.getUserById(authReq.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }
    if (!user.googleId) {
      return res.status(400).json({ success: false, message: 'Belum ada akun Google yang terhubung.' });
    }
    if (!user.hasLocalPassword) {
      return res.status(400).json({ success: false, message: 'Atur password lokal terlebih dahulu sebelum memutus akun Google.' });
    }

    const updatedUser = await userService.unlinkGoogleAccount(user.id);
    return res.json({ success: true, data: apiView.formatUser(updatedUser) });
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
    const removeAvatar = authReq.body.removeAvatar === true || authReq.body.removeAvatar === 'true';

    if (authReq.body.removeAvatar !== undefined && !removeAvatar && authReq.body.removeAvatar !== false && authReq.body.removeAvatar !== 'false') {
      throw Object.assign(new Error('Permintaan penghapusan foto profil tidak valid.'), { statusCode: 400 });
    }
    if (uploadedPhoto && removeAvatar) {
      throw Object.assign(new Error('Foto profil tidak dapat diganti dan dihapus sekaligus.'), { statusCode: 400 });
    }

    if (authReq.body.name !== undefined) {
      updatePayload.name = authReq.body.name;
    }

    const currentUser = uploadedPhoto || removeAvatar ? await userService.getUserById(authReq.user.id) : null;
    if ((uploadedPhoto || removeAvatar) && !currentUser) {
      throw Object.assign(new Error('User tidak ditemukan.'), { statusCode: 404 });
    }

    if (removeAvatar) {
      updatePayload.avatarUrl = null;
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
      if (typeof authReq.body.password !== 'string' || authReq.body.password.length < 6) {
        throw new Error('password minimal 6 karakter.');
      }

      const passwordUser = await userService.getUserById(authReq.user.id);
      if (!passwordUser) {
        throw Object.assign(new Error('User tidak ditemukan.'), { statusCode: 404 });
      }
      if (passwordUser.hasLocalPassword && (typeof currentPassword !== 'string' || !currentPassword.trim())) {
        throw new Error('password lama wajib diisi.');
      }
      const passwordMatches = !passwordUser.hasLocalPassword
        || (typeof currentPassword === 'string' && await bcrypt.compare(currentPassword, passwordUser.password));

      if (!passwordMatches) {
        throw new Error('password lama salah.');
      }

      updatePayload.password = authReq.body.password;
      updatePayload.hasLocalPassword = true;
    }

    const user = await userService.updateUser(authReq.user.id, updatePayload);
    if (currentUser?.avatarUrl && currentUser.avatarUrl !== user.avatarUrl) {
      await removeStoredProfilePhoto(currentUser.avatarUrl);
    }
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
  linkGoogleAccount,
  unlinkGoogleAccount,
};
