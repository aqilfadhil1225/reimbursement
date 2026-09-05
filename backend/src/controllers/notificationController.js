const notificationService = require('../services/notificationService');
const apiView = require('../views/apiView');

const listNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotifications(req.user.id);
    return res.json({ success: true, data: notifications.map(apiView.formatNotification) });
  } catch (error) {
    return next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markNotificationAsRead(req.params.id, req.user.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan.' });
    }
    return res.json({ success: true, data: apiView.formatNotification(notification) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listNotifications,
  markNotificationRead,
};
