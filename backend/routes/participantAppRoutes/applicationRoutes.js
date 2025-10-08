import express from "express";
import multer from "multer";
import Application from "../../models/participant_app/application.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { sendRejectionEmail } from "../../config/emailConfig.js";

// Load environment variables
dotenv.config();

// Set up file path and file name generation for uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads/payments directory exists (multer will fail if missing)
const paymentsDir = path.join(__dirname, "../../uploads/payments");
if (!fs.existsSync(paymentsDir)) {
  fs.mkdirSync(paymentsDir, { recursive: true });
}

// Set up multer storage for payment screenshots
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, paymentsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage });
const router = express.Router();

// Helper function to generate a unique registration token
function generateRegistrationToken() {
  // Generate a random token with prefix ZAB- followed by current year and random alphanumeric characters
  const currentYear = new Date().getFullYear();
  const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ZAB-${currentYear}-${randomString}`;
}

// POST route to handle application submission
router.post("/", upload.single("paymentScreenshot"), async (req, res) => {
  try {
    const { moduleId, participationType, moduleTitle, totalFee } = req.body;

    // Build participants from multipart form-data safely
    let participantsArray = [];
    if (Array.isArray(req.body.participants)) {
      participantsArray = req.body.participants;
    } else if (typeof req.body.participants === 'string') {
      try {
        const parsed = JSON.parse(req.body.participants);
        if (Array.isArray(parsed)) participantsArray = parsed;
      } catch (_) {
        // If not valid JSON, will try bracketed fields
      }
    }

    if (participantsArray.length === 0) {
      // Attempt reconstruct from bracketed keys like participants[0][name]
      const temp = {};
      for (const key of Object.keys(req.body)) {
        const match = key.match(/^participants\[(\d+)\]\[(\w+)\]$/);
        if (match) {
          const idx = parseInt(match[1], 10);
          const field = match[2];
          if (!temp[idx]) temp[idx] = {};
          temp[idx][field] = req.body[key];
        }
      }
      const indices = Object.keys(temp).map(n => parseInt(n, 10)).sort((a,b) => a-b);
      participantsArray = indices.map(i => temp[i]);
    }

    // Check if participants data is received
    if (!participantsArray || participantsArray.length === 0) {
      return res.status(400).json({ message: "Participants data is missing." });
    }

    // Validate participant data
    const participantDetails = participantsArray.map((p) => ({
      name: p?.name,
      rollNumber: p?.rollNumber,
      email: p?.email,
      contactNumber: p?.contactNumber,
      department: p?.department,
      university: p?.university,
    }));

    // Validate that at least one participant's name and rollNumber are provided
    for (const participant of participantDetails) {
      if (!participant.name || !participant.rollNumber) {
        return res.status(400).json({
          message: "Name and Roll Number are required for all participants."
        });
      }
    }

    // Generate a unique registration token
    const registrationToken = generateRegistrationToken();
    
    // Log the participants data for debugging
    console.log("Participants Data:", participantDetails);
    console.log("Generated Registration Token:", registrationToken);

    // Get userId from token if available
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }

    // Save to the database
    const newApplication = new Application({
      moduleId,
      participationType,
      moduleTitle,
      totalFee,
      participants: participantDetails,
      paymentScreenshot: req.file ? "uploads/payments/" + req.file.filename : '',
      registrationToken, // Add the registration token
      userId, // Store the user ID if available
    });

    // Save the application in the database
    await newApplication.save();

    res.status(200).json({
      message: "Application submitted successfully",
      application: newApplication,
      registrationToken: registrationToken, // Explicitly include the token in response
    });
  } catch (err) {
    console.error("❌ Application submission error:", err);
    res.status(500).json({ message: "Failed to submit application", error: err.message });
  }
});

// GET route to fetch all applications
router.get("/", async (req, res) => {
  try {
    const applications = await Application.find().populate("moduleId", "title fee");
    res.json(applications);
  } catch (err) {
    console.error("❌ Fetching applications failed:", err);
    res.status(500).json({ message: "Error fetching applications" });
  }
});

// NEW: GET route to fetch applications for the current user
router.get("/user-applications", async (req, res) => {
  try {
    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let userId;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    console.log(`Searching applications for userId: ${userId}`);
    
    // Extract the email from token or query parameter
    let userEmail = '';
    try {
      // Try to get email from token verification if possible
      const user = await mongoose.model('participantUser').findById(userId);
      if (user) {
        userEmail = user.email;
        console.log(`Found user email from token: ${userEmail}`);
      }
    } catch (err) {
      console.log('Error fetching user email:', err);
    }
    
    // Find applications where participants have the user's email
    // or where userId matches if that field exists
    const applications = await Application.find({ 
      $or: [
        { userId: userId },
        { 'participants.email': { $regex: new RegExp(userEmail, 'i') } },
      ]
    });
    
    console.log(`Found ${applications.length} applications for user`);

    res.status(200).json(applications);
  } catch (err) {
    console.error("❌ Fetching user applications failed:", err);
    res.status(500).json({ message: "Error fetching user applications", error: err.message });
  }
});

router.put('/reject/:id', async (req, res) => {
    try {
      console.log("Rejecting ID:", req.params.id);
      const app = await Application.findByIdAndUpdate(req.params.id, { status: 'Rejected' }, { new: true });
  
      if (!app) {
        console.log("❌ Application not found for ID:", req.params.id);
        return res.status(404).json({ message: 'Application not found' });
      }

      // Send rejection emails to all participants
      const emailPromises = [];
      const uniqueEmails = new Set(); // To avoid sending duplicate emails
      
      // Collect unique participant emails
      app.participants.forEach(participant => {
        if (participant.email && !uniqueEmails.has(participant.email)) {
          uniqueEmails.add(participant.email);
        }
      });

      // Send email to each unique participant
      for (const email of uniqueEmails) {
        const emailPromise = sendRejectionEmail(email, {
          moduleTitle: app.moduleTitle,
          participants: app.participants,
          registrationToken: app.registrationToken
        });
        emailPromises.push(emailPromise);
      }

      // Wait for all emails to be sent
      const emailResults = await Promise.allSettled(emailPromises);
      
      // Log email results
      emailResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          console.log(`✅ Rejection email sent successfully to: ${Array.from(uniqueEmails)[index]}`);
        } else {
          console.error(`❌ Failed to send rejection email to: ${Array.from(uniqueEmails)[index]}`, result.reason || result.value?.error);
        }
      });

      const successfulEmails = emailResults.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
  
      res.status(200).json({ 
        message: 'Application rejected successfully', 
        app,
        emailStatus: {
          totalEmails: uniqueEmails.size,
          successfulEmails: successfulEmails,
          failedEmails: uniqueEmails.size - successfulEmails
        }
      });
    } catch (err) {
      console.error("❌ Reject failed:", err.message);
      res.status(500).json({ message: 'Error rejecting application', error: err.message });
    }
  });

export default router;