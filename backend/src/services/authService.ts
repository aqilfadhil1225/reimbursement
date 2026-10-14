import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import config from '../config';
import authModel from '../models/authModel';

const googleClient = new OAuth2Client(config.googleClientId);

const authError = (message: string, statusCode: number) =>
  Object.assign(new Error(message), { statusCode });

const validateCredentials = ({ name, email, password }: { name?: unknown; email?: unknown; password?: unknown }) => {
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    throw new Error('name, email, dan password wajib diisi.');
  }

  if (password.length < 6) {
    throw new Error('password minimal 6 karakter.');
  }

  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: 'EMPLOYEE',
  };
};

const publicUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatarUrl: user.avatarUrl ?? null,
  googleLinked: Boolean(user.googleId),
  hasLocalPassword: user.hasLocalPassword ?? true,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createToken = (user: any) => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  config.jwtSecret,
  { expiresIn: '1d' },
);

const verifyGoogleCredential = async (credential: unknown) => {
  if (typeof credential !== 'string' || !credential) {
    throw authError('Token Google wajib diisi.', 400);
  }
  if (!config.googleClientId) {
    throw authError('Google SSO belum dikonfigurasi di server.', 503);
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });
  } catch {
    throw authError('Token Google tidak valid atau sudah kedaluwarsa.', 401);
  }

  const profile = ticket.getPayload();
  if (!profile?.email || profile.email_verified !== true || !profile.sub) {
    throw authError('Akun Google harus memiliki email terverifikasi.', 401);
  }

  return profile;
};

const register = async (payload: any) => {
  const data = validateCredentials(payload);
  const existingUser = await authModel.findUserByEmail(data.email);

  if (existingUser) {
    throw new Error('email sudah terdaftar.');
  }

  const password = await bcrypt.hash(data.password, 12);
  const user = await authModel.createUser({ ...data, password });

  return { user: publicUser(user), token: createToken(user) };
};

const login = async ({ email, password }: { email?: unknown; password?: unknown }) => {
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw new Error('email dan password wajib diisi.');
  }

  const user = await authModel.findUserByEmail(email.trim().toLowerCase());
  const passwordMatches = user && await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new Error('email atau password salah.');
  }

  return { user: publicUser(user), token: createToken(user) };
};

const loginWithGoogle = async (credential: unknown) => {
  const profile = await verifyGoogleCredential(credential);

  if (!profile.sub) {
    throw authError('Google tidak mengembalikan identitas akun yang valid.', 401);
  }

  const email = profile.email.trim().toLowerCase();
  let user = await authModel.findUserByGoogleId(profile.sub);

  if (!user) {
    const existingUser = await authModel.findUserByEmail(email);
    if (existingUser?.googleId) {
      throw authError('Email ini sudah terhubung ke akun Google lain.', 409);
    }
    user = existingUser;
  }

  if (!user) {
    const password = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
    try {
      user = await authModel.createUser({
        name: profile.name?.trim() || email.split('@')[0],
        email,
        password,
        role: 'EMPLOYEE',
        googleId: profile.sub,
        hasLocalPassword: false,
      });
    } catch (error) {
      if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 'P2002') {
        throw error;
      }

      user = await authModel.findUserByEmail(email);
      if (!user) throw error;
      if (user.googleId && user.googleId !== profile.sub) {
        throw authError('Email ini sudah terhubung ke akun Google lain.', 409);
      }
    }
  }

  return { user: publicUser(user), token: createToken(user) };
};

export default {
  register,
  login,
  loginWithGoogle,
  verifyGoogleCredential,
};
