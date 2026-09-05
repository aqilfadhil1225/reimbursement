const jwt = require('jsonwebtoken');
const config = require('../config');

const authenticate = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization && authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token login wajib dikirim.' });
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token login tidak valid atau sudah kedaluwarsa.' });
  }
};

module.exports = authenticate;
