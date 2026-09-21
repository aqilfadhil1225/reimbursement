import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config';
import authModel from '../models/authModel';

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
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createToken = (user: any) => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  config.jwtSecret,
  { expiresIn: '1d' },
);

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

export default {
  register,
  login,
};
