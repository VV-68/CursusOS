const pool = require('../db/connection');

const createNotification = async (creator_id, receiver_id, message) => {
  const { rows } = await pool.query(
    `INSERT INTO notifications (creator_id, receiver_id, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [creator_id, receiver_id, message]
  );
  return rows[0];
};

const getNotificationsByReceiver = async (receiver_id) => {
  const { rows } = await pool.query(
    `SELECT n.*, u.full_name as creator_name
     FROM notifications n
     LEFT JOIN users u ON u.id = n.creator_id
     WHERE n.receiver_id = $1
     ORDER BY n.created_at DESC`,
    [receiver_id]
  );
  return rows;
};

const clearNotifications = async (receiver_id) => {
  await pool.query(
    `DELETE FROM notifications WHERE receiver_id = $1`,
    [receiver_id]
  );
};

const deleteNotification = async (id, receiver_id) => {
  await pool.query(
    `DELETE FROM notifications WHERE id = $1 AND receiver_id = $2`,
    [id, receiver_id]
  );
};

module.exports = {
  createNotification,
  getNotificationsByReceiver,
  clearNotifications,
  deleteNotification,
};
