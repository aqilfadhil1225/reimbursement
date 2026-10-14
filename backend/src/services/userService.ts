import bcrypt from 'bcrypt';
import userModel from '../models/userModel';

const normalizeRole = (role: unknown): string | undefined => {
  const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : undefined;

  if (normalizedRole && !(userModel.USER_ROLES as readonly string[]).includes(normalizedRole)) {
    throw new Error('role harus EMPLOYEE, MANAGER, atau FINANCE.');
  }

  return normalizedRole;
};

const validateId = (id: unknown) => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new Error('id user tidak valid.');
  }

  return parsedId;
};

const validateUserData = ({ name, email, password, role }: any) => {
  if (!name || !email || !password || !role) {
    throw new Error('name, email, password, dan role wajib diisi.');
  }

  const normalizedRole = normalizeRole(role);

  return {
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password,
    role: normalizedRole,
  };
};

const getUsers = (role: unknown) => userModel.findAll(normalizeRole(role));

const getUserById = (id: unknown) => userModel.findById(validateId(id));

const createUser = async (payload: any) => {
  const data = validateUserData(payload);
  return userModel.create({
    ...data,
    password: await bcrypt.hash(data.password, 12),
  });
};

const updateUser = async (id: unknown, payload: any) => {
  const data: any = {};

  if (payload.name !== undefined) {
    if (typeof payload.name !== 'string' || !payload.name.trim()) {
      throw new Error('name tidak boleh kosong.');
    }
    data.name = payload.name.trim();
  }

  if (payload.email !== undefined) {
    if (typeof payload.email !== 'string' || !payload.email.trim()) {
      throw new Error('email tidak boleh kosong.');
    }
    data.email = payload.email.trim().toLowerCase();
  }

  if (payload.avatarUrl !== undefined) {
    if (payload.avatarUrl !== null && (typeof payload.avatarUrl !== 'string' || !payload.avatarUrl.trim())) {
      throw new Error('avatarUrl tidak valid.');
    }
    data.avatarUrl = payload.avatarUrl === null ? null : payload.avatarUrl.trim();
  }

  if (payload.googleId !== undefined) {
    if (payload.googleId !== null && (typeof payload.googleId !== 'string' || !payload.googleId.trim())) {
      throw new Error('googleId tidak valid.');
    }
    data.googleId = payload.googleId === null ? null : payload.googleId.trim();
  }

  if (payload.role !== undefined) {
    data.role = normalizeRole(payload.role);
  }

  if (payload.password !== undefined) {
    if (typeof payload.password !== 'string' || payload.password.length < 6) {
      throw new Error('password minimal 6 karakter.');
    }
    data.password = await bcrypt.hash(payload.password, 12);
  }

  if (payload.hasLocalPassword !== undefined) {
    data.hasLocalPassword = Boolean(payload.hasLocalPassword);
  }

  if (!Object.keys(data).length) {
    throw new Error('tidak ada data user yang diubah.');
  }

  return userModel.updateById(validateId(id), data);
};

const deleteUser = (id: unknown) => userModel.deleteById(validateId(id));

const linkGoogleAccount = async (id: unknown, googleId: string) => {
  const userId = validateId(id);
  const linkedUser = await userModel.findByGoogleId(googleId);
  if (linkedUser && linkedUser.id !== userId) {
    throw Object.assign(new Error('Akun Google ini sudah terhubung ke akun lain.'), { statusCode: 409 });
  }

  return updateUser(userId, { googleId });
};

const unlinkGoogleAccount = (id: unknown) => updateUser(id, { googleId: null });

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  linkGoogleAccount,
  unlinkGoogleAccount,
};
