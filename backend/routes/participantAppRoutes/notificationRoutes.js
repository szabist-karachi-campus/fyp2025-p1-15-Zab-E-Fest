import express from "express";
import Notification from "../../models/adminModels/notification.js";
import { protect } from "../../middlewares/authMiddleware.js";
import mongoose from "mongoose";

const router = express.Router();

/**
 * GET /api/notifications/participant
 * Get all notifications for the current participant
 */
router.get("/participant", protect, async (req, res) => {
  try {
    // Ensure we have valid user data
    if (!req.user || !req.user._id) {
      console.error('Invalid user data in request:', req.user);
      return res.status(401).json({ error: 'User not authenticated properly' });
    }

    const userId = req.user._id;
    const userEmail = req.user.email || '';
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : ['Participant'];

    console.log('Fetching notifications for user:', {
      userId: userId.toString(),
      userEmail,
      userRoles
    });

    console.log('Finding notifications for user:', {
      userId: req.user._id.toString(),
      roles: req.user.roles
    });

    // Find notifications where:
    // 1. targetRole array includes "Participant" OR
    // 2. targetRole array includes user's specific roles
    const notifications = await Notification.find({
      $or: [
        { targetRole: "Participant" },  // Single string match
        { targetRole: { $in: ["Participant"] } },  // Array match
        { targetRole: { $in: req.user.roles || [] } }
      ]
    })
    .sort({ date: -1 })
    .lean(); // Convert to plain JavaScript objects

    console.log('Found notifications:', notifications);

    console.log('Found notifications:', notifications); // Debug log

    // Transform notifications for mobile app
    const transformedNotifications = notifications.map(notification => {
      try {
        // Ensure we have a valid notification object
        if (!notification || typeof notification !== 'object') {
          console.error('Invalid notification object:', notification);
          return null;
        }

        // Safely get _id
        let notificationId;
        try {
          notificationId = notification._id ? notification._id.toString() : null;
          if (!notificationId) {
            console.error('Notification missing _id:', notification);
            return null;
          }
        } catch (err) {
          console.error('Error getting notification _id:', err);
          return null;
        }

        // Safely check read status
        let isRead = false;
        try {
          if (Array.isArray(notification.isRead)) {
            isRead = notification.isRead.some(read => 
              read && read.userId && read.userId.toString() === userId.toString()
            );
          }
        } catch (err) {
          console.error(`Error checking read status for notification ${notificationId}:`, err);
        }

        // Safely get sender info
        let sender = { name: "Admin", role: "Staff" };
        try {
          if (notification.sender && typeof notification.sender === 'object') {
            sender = {
              name: String(notification.sender.name || "Admin"),
              role: String(notification.sender.role || "Staff")
            };
          }
        } catch (err) {
          console.error(`Error getting sender info for notification ${notificationId}:`, err);
        }

        // Transform with safe type conversions
        const transformed = {
          _id: notificationId,
          title: String(notification.title || "Notification"),
          message: String(notification.message || ""),
          type: String(notification.type || "announcement").toLowerCase(),
          priority: String(notification.priority || "medium").toLowerCase(),
          isRead: isRead,
          date: notification.date instanceof Date 
            ? notification.date.toISOString() 
            : new Date().toISOString(),
          sender: sender,
          module: notification.module ? String(notification.module) : '',
          actionUrl: notification.actionUrl ? String(notification.actionUrl) : '',
          image: notification.image ? String(notification.image) : ''
        };

        console.log('Successfully transformed notification:', {
          id: transformed._id,
          title: transformed.title
        });

        return transformed;
      } catch (error) {
        console.error('Error transforming notification:', error);
        return null;
      }
    });

    // Filter out any null notifications from transformation
    const validNotifications = transformedNotifications.filter(n => n !== null);

    console.log('Sending notifications to client:', {
      count: validNotifications.length,
      notifications: validNotifications
    });

    res.json({
      userId: userId.toString(),
      notifications: validNotifications
    });
  } catch (err) {
    console.error("Error fetching participant notifications:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/notifications/participant/:id/read
 * Mark a notification as read for the current participant
 */
router.put("/participant/:id/read", protect, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user has already read this notification
    const alreadyRead = notification.isRead?.some(
      read => read.userId.toString() === userId.toString()
    );

    if (!alreadyRead) {
      // Add user to isRead array with current timestamp
      await Notification.findByIdAndUpdate(notificationId, {
        $push: {
          isRead: {
            userId: userId,
            readAt: new Date()
          }
        }
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/notifications/participant/mark-all-read
 * Mark all notifications as read for the current participant
 */
router.put("/participant/mark-all-read", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all unread notifications for this user
    const notifications = await Notification.find({
      "isRead.userId": { $ne: userId },
      $or: [
        { targetRole: "Participant" },
        { targetRole: { $in: req.user.roles || [] } }
      ]
    });

    // Mark each notification as read
    await Promise.all(notifications.map(notification => 
      Notification.findByIdAndUpdate(notification._id, {
        $push: {
          isRead: {
            userId: userId,
            readAt: new Date()
          }
        }
      })
    ));

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/notifications/participant/unread-count
 * Get count of unread notifications for the current participant
 */
router.get("/participant/unread-count", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      "isRead.userId": { $ne: userId },
      $or: [
        { targetRole: "Participant" },
        { targetRole: { $in: req.user.roles || [] } }
      ]
    });

    res.json({ count });
  } catch (err) {
    console.error("Error getting unread notification count:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
