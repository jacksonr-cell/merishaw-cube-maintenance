import { Router } from 'express';
import { db } from '../db.ts';
import { authenticateToken, type AuthRequest } from '../auth.ts';

export const notificationRouter = Router();

// GET /api/notifications - List user notifications with unread count
notificationRouter.get('/', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;

  const notifications = db.prepare(`
    SELECT n.*, t.reference_no, t.title as ticket_title
    FROM notifications n
    LEFT JOIN tickets t ON n.ticket_id = t.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(user.id);

  const unreadCount = (db.prepare(`
    SELECT COUNT(*) as count 
    FROM notifications 
    WHERE user_id = ? AND is_read = 0
  `).get(user.id) as { count: number }).count;

  res.json({
    notifications,
    unread_count: unreadCount
  });
});

// PATCH /api/notifications/:id/read - Mark one as read
notificationRouter.patch('/:id/read', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user = req.user!;

  db.prepare(`
    UPDATE notifications 
    SET is_read = 1 
    WHERE id = ? AND user_id = ?
  `).run(id, user.id);

  res.json({ message: 'Notification marked as read.' });
});

// POST /api/notifications/mark-all-read - Mark all as read
notificationRouter.post('/mark-all-read', authenticateToken, (req: AuthRequest, res) => {
  const user = req.user!;

  db.prepare(`
    UPDATE notifications 
    SET is_read = 1 
    WHERE user_id = ?
  `).run(user.id);

  res.json({ message: 'All notifications marked as read.' });
});
