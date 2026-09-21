import notificationModel from '../models/notificationModel';

const validateId = (id: unknown, label: string) => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new Error(`${label} tidak valid.`);
  }

  return parsedId;
};

const getNotifications = (userId: unknown) => notificationModel.findAll(
  validateId(userId, 'userId'),
);

const markNotificationAsRead = async (id: unknown, userId: unknown) => {
  const notificationId = validateId(id, 'id notifikasi');
  const ownerId = validateId(userId, 'userId');
  const notification = await notificationModel.findById(notificationId);

  if (!notification || notification.userId !== ownerId) return null;
  return notificationModel.markAsRead(notificationId);
};

export default {
  getNotifications,
  markNotificationAsRead,
};
