const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const authModel = require('../models/authModel');
const userModel = require('../models/userModel');

const validateCredentials = ({ name, email, password, role }) => {
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || typeof role !== 'string') {
    throw new Error('name, email, password, dan role wajib diisi.');
  }

  const normalizedRole = role.trim().toUpperCase();
  if (!userModel.USER_ROLES.includes(normalizedRole)) {
    throw new Error('role harus EMPLOYEE, MANAGER, atau FINANCE.');
  }

  if (password.length < 6) {
    throw new Error('password minimal 6 karakter.');
  }

  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: normalizedRole,
  };
};

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  config.jwtSecret,
  { expiresIn: '1d' },
);

const register = async (payload) => {
  const data = validateCredentials(payload);
  const existingUser = await authModel.findUserByEmail(data.email);

  if (existingUser) {
    throw new Error('email sudah terdaftar.');
  }

  const password = await bcrypt.hash(data.password, 12);
  const user = await authModel.createUser({ ...data, password });

  return { user: publicUser(user), token: createToken(user) };
};

const login = async ({ email, password }) => {
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

module.exports = {
  register,
  login,
};
