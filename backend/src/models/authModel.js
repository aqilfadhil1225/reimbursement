const prisma = require('../config/prisma');

const findUserByEmail = (email) => prisma.user.findUnique({
  where: { email },
});

const createUser = (data) => prisma.user.create({
  data,
});

module.exports = {
  findUserByEmail,
  createUser,
};
