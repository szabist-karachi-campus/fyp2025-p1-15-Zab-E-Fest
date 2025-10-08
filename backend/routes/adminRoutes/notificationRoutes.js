import express from "express";
import multer from "multer";
import Notification from "../../models/adminModels/notification.js";

const router = express.Router();

// Configure image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/notifications/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

/**
 * POST /api/notifications/send
 * Create a new notification
 */
router.post("/send", upload.single("image"), async (req, res) => {
  try {
    const { 
      title,
      message,
      targetRole,
      type,
      priority,
      module,
      sender: senderString
    } = req.body;

    // Parse sender JSON string
    let sender;
    try {
      sender = JSON.parse(senderString);
    } catch (e) {
      return res.status(400).json({ 
        error: "Invalid sender data. Must be a JSON string with name and role." 
      });
    }

    // Validate required fields
    if (!title || !message || !targetRole || !sender.name || !sender.role) {
      return res.status(400).json({
        error: "Missing required fields: title, message, targetRole, sender.name, and sender.role are required"
      });
    }

    // Convert targetRole to array if it's not already
    const roles = Array.isArray(targetRole) ? targetRole : [targetRole];

    // Create notification object
    const notification = new Notification({
      title,
      message,
      targetRole: roles,
      type: type || "announcement",
      priority: priority || "medium",
      module: module || undefined,
      sender: {
        name: sender.name,
        role: sender.role
      },
      image: req.file ? `/uploads/notifications/${req.file.filename}` : undefined,
    });

    // Save notification
    const savedNotification = await notification.save();
    
    res.status(201).json({ 
      message: "Notification created successfully", 
      notification: savedNotification 
    });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ 
      error: err.message,
      details: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : undefined
    });
  }
});

/**
 * GET /api/notifications
 * Retrieve all notifications
 */
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ date: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/notifications/role/:role
 * Retrieve notifications for a specific role
 */
router.get("/role/:role", async (req, res) => {
  try {
    const notifications = await Notification.find({ role: req.params.role }).sort({ date: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/notifications/:id
 * Update a notification by ID
 */
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { message, role } = req.body;
    const roles = Array.isArray(role) ? role : [role];
    const updateData = {
      message,
      role: roles,
    };
    if (req.file) {
      updateData.image = `/uploads/notifications/${req.file.filename}`;
    }
    const updated = await Notification.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification updated", notification: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
