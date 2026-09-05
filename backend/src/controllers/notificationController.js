const notificationService = require('../services/notificationService');

const listNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotifications(req.query.userId);
    return res.json({ success: true, data: notifications });
  } catch (error) {
    return next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markNotificationAsRead(req.params.id);
    return res.json({ success: true, data: notification });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listNotifications,
  markNotificationRead,
};
