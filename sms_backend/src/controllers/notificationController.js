const notificationModel = require('../models/notificationModel');

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await notificationModel.getNotificationsByReceiver(req.user.id);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const clearMyNotifications = async (req, res) => {
  try {
    await notificationModel.clearNotifications(req.user.id);
    res.json({ message: 'Notifications cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteOne = async (req, res) => {
  try {
    const { id } = req.params;
    await notificationModel.deleteNotification(id, req.user.id);
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getMyNotifications,
  clearMyNotifications,
  deleteOne,
};
