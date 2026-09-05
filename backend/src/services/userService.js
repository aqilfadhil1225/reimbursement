const userModel = require('../models/userModel');

const normalizeRole = (role) => {
  const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : role;

  if (normalizedRole && !userModel.USER_ROLES.includes(normalizedRole)) {
    throw new Error('role harus EMPLOYEE, MANAGER, atau FINANCE.');
  }

  return normalizedRole;
};

const validateId = (id) => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new Error('id user tidak valid.');
  }

  return parsedId;
};

const validateUserData = ({ name, email, role }) => {
  if (!name || !email || !role) {
    throw new Error('name, email, dan role wajib diisi.');
  }

  const normalizedRole = normalizeRole(role);

  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: normalizedRole,
  };
};

const getUsers = (role) => userModel.findAll(normalizeRole(role));

const getUserById = (id) => userModel.findById(validateId(id));

const createUser = (payload) => userModel.create(validateUserData(payload));

const updateUser = (id, payload) => {
  const data = {};

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

  if (payload.role !== undefined) {
    data.role = normalizeRole(payload.role);
  }

  if (!Object.keys(data).length) {
    throw new Error('tidak ada data user yang diubah.');
  }

  return userModel.updateById(validateId(id), data);
};

const deleteUser = (id) => userModel.deleteById(validateId(id));

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
