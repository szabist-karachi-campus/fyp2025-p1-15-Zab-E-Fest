import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  createNotification,
  getAllNotifications,
  deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// Participant routes (require participant authentication)
router.get('/', protect, getNotifications);
router.put('/:notificationId/read', protect, markNotificationAsRead);
router.put('/mark-all-read', protect, markAllNotificationsAsRead);
router.get('/unread-count', protect, getUnreadNotificationCount);

// Admin routes (require admin authentication)
router.post('/', protect, createNotification);
router.get('/admin/all', protect, getAllNotifications);
router.delete('/:notificationId', protect, deleteNotification);

export default router;
