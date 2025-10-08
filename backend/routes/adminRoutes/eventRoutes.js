import express from "express";
import multer from "multer";
import path from "path";
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventParticipants,
} from "../../controllers/adminController/eventController.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Debug middleware
router.use((req, res, next) => {
  console.log(`Event route accessed: ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
router.get("/", getAllEvents);
router.get("/event-participants", getEventParticipants);

router.post("/", upload.single("image"), createEvent);
router.put("/:id", upload.single("image"), updateEvent);
router.delete("/:id", deleteEvent);

export default router;
