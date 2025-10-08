import mongoose from 'mongoose';

// Participant Schema for each participant
const participantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true },
  email: { type: String, required: false },
  contactNumber: { type: String, required: false },
  department: { type: String, required: false },
  university: { type: String, required: false },
});

// Application Schema that includes participants and payment screenshot
const applicationSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module", // Assumes you have a "Module" model
    required: true,
  },
  moduleTitle: { type: String, required: true },  // Store module title
  totalFee: { type: Number, required: true },  // Store total fee
  participationType: { type: String, required: true }, 
  participants: [participantSchema], // Array of participants
  paymentScreenshot: { type: String, required: true }, 
  registrationToken: { 
    type: String, 
    required: true,
    unique: true,
    index: true // Add index for faster searching
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "participantUser", // Reference to the user model
    index: true // Add index for faster user-based queries
  },
  // Path to the payment screenshot
}, { timestamps: true });

export default mongoose.model("Application", applicationSchema);
