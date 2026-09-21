import prisma from '../config/prisma';

const findAll = (userId: unknown) => prisma.notification.findMany({
  where: userId ? { userId: Number(userId) } : undefined,
  include: { reimbursement: true },
  orderBy: { createdAt: 'desc' },
});

const findById = (id: unknown) => prisma.notification.findUnique({
  where: { id: Number(id) },
});

const markAsRead = (id: unknown) => prisma.notification.update({
  where: { id: Number(id) },
  data: { isRead: true },
});

export default {
  findAll,
  findById,
  markAsRead,
};
