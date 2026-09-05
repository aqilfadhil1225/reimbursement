const notificationModel = require('../models/notificationModel');

const validateId = (id, label) => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new Error(`${label} tidak valid.`);
  }

  return parsedId;
};

const getNotifications = (userId) => {
  if (userId === undefined) return notificationModel.findAll();
  return notificationModel.findAll(validateId(userId, 'userId'));
};

const markNotificationAsRead = (id) => notificationModel.markAsRead(
  validateId(id, 'id notifikasi'),
);

module.exports = {
  getNotifications,
  markNotificationAsRead,
};
