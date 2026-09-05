const notificationModel = require('../models/notificationModel');

const validateId = (id, label) => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new Error(`${label} tidak valid.`);
  }

  return parsedId;
};

const getNotifications = (userId) => notificationModel.findAll(
  validateId(userId, 'userId'),
);

const markNotificationAsRead = async (id, userId) => {
  const notificationId = validateId(id, 'id notifikasi');
  const ownerId = validateId(userId, 'userId');
  const notification = await notificationModel.findById(notificationId);

  if (!notification || notification.userId !== ownerId) return null;
  return notificationModel.markAsRead(notificationId);
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
};
