const userService = require('../services/userService');
const apiView = require('../views/apiView');
const jwt = require('jsonwebtoken');
const config = require('../config');

const createToken = (user) => jwt.sign(
  { id: user.id, name: user.name, email: user.email, role: user.role },
  config.jwtSecret,
  { expiresIn: '1d' },
);

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }
    return res.json({ success: true, data: apiView.formatUser(user) });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.user.id, {
      name: req.body.name,
      email: req.body.email,
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

module.exports = {
  getProfile,
  updateProfile,
};
