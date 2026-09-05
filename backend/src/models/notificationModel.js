const prisma = require('../config/prisma');

const findAll = (userId) => prisma.notification.findMany({
  where: userId ? { userId: Number(userId) } : undefined,
  include: { reimbursement: true },
  orderBy: { createdAt: 'desc' },
});

const findById = (id) => prisma.notification.findUnique({
  where: { id: Number(id) },
});

const markAsRead = (id) => prisma.notification.update({
  where: { id: Number(id) },
  data: { isRead: true },
});

module.exports = {
  findAll,
  findById,
  markAsRead,
};
