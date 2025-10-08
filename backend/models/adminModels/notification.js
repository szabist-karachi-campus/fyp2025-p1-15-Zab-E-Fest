import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  sender: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["schedule", "announcement", "payment", "results", "event", "deadline", "feedback", "warning"],
    default: "announcement"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  image: { type: String },
  targetRole: {
    type: [String],
    enum: ["Participant", "ModuleHead", "ModuleLeader"],
    default: ["Participant"],
    required: true
  },
  sender: {
    name: { type: String, required: true },
    role: { type: String, required: true }
  },
  isRead: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'participantUser' },
    readAt: { type: Date }
  }],
  expiresAt: { type: Date },
  date: { type: Date, default: Date.now },
  replies: [replySchema],
  actionUrl: { type: String },
  module: { type: String }, // Optional: specific module this notification is related to
});

export default mongoose.model("Notification", notificationSchema);
