const express = require('express');
const router = express.Router();
const db = require('../config/db');

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  next();
}

router.use(requireAuth);

// @route   GET /api/notifications
// @desc    Get current user's notifications (most recent 50)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.session.user.id]
    );

    const unreadCount = result.rows.filter(notification => !notification.is_read).length;
    res.json({ notifications: result.rows, unreadCount });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read for current user
router.put('/read-all', async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.session.user.id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Notifications read-all error:', error);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a specific notification as read for current user
router.put('/:id/read', async (req, res) => {
  const notificationId = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(notificationId) || notificationId <= 0) {
    return res.status(400).json({ error: 'Invalid notification id.' });
  }

  try {
    const result = await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, req.session.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Notification read error:', error);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

module.exports = router;
