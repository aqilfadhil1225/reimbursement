import { RequestHandler } from 'express';
import notificationService from '../services/notificationService';
import apiView from '../views/apiView';

const listNotifications: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any };
    const notifications = await notificationService.getNotifications(authReq.user.id);
    return res.json({ success: true, data: notifications.map(apiView.formatNotification) });
  } catch (error) {
    return next(error);
  }
};

const markNotificationRead: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as typeof req & { user?: any; params: Record<string, any> };
    const notification = await notificationService.markNotificationAsRead(authReq.params.id, authReq.user.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan.' });
    }
    return res.json({ success: true, data: apiView.formatNotification(notification) });
  } catch (error) {
    return next(error);
  }
};

export default {
  listNotifications,
  markNotificationRead,
};
