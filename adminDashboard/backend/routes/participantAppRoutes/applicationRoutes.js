import express from "express";
import multer from "multer";
import Application from "../../models/participant_app/application.js";
import path from "path";
import { fileURLToPath } from "url";

// Set up file path and file name generation for uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer storage for payment screenshots
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads/payments"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage });
const router = express.Router();

// POST route to handle application submission
router.post("/", upload.single("paymentScreenshot"), async (req, res) => {
  try {
    const { moduleId, participationType,moduleTitle, totalFee, participants } = req.body;

    // Check if participants data is received
    if (!participants || participants.length === 0) {
      return res.status(400).json({ message: "Participants data is missing." });
    }

    // Validate participant data
    const participantDetails = participants.map((p) => ({
      name: p.name,
      rollNumber: p.rollNumber,
      email: p.email,
      contactNumber: p.contactNumber,
      department: p.department,
      university: p.university,
    }));

    // Validate that at least one participant's name and rollNumber are provided
    participantDetails.forEach(participant => {
      if (!participant.name || !participant.rollNumber) {
        return res.status(400).json({
          message: "Name and Roll Number are required for all participants."
        });
      }
    });

    // Log the participants data for debugging
    console.log("Participants Data:", participantDetails);

    // Save to the database
    const newApplication = new Application({
      moduleId,
      participationType,
      moduleTitle,
       totalFee,
      participants: participantDetails,
      paymentScreenshot: req.file ? "uploads/payments/" + req.file.filename : '',
    });

    // Save the application in the database
    await newApplication.save();

    res.status(200).json({
      message: "Application submitted successfully",
      application: newApplication,
    });
  } catch (err) {
    console.error("❌ Application submission error:", err);
    res.status(500).json({ message: "Failed to submit application", error: err.message });
  }
});

// GET route to fetch all applications, including module info (title, fee)
router.get("/", async (req, res) => {
  try {
    const applications = await Application.find().populate("moduleId", "title fee");
    res.json(applications);
  } catch (err) {
    console.error("❌ Fetching applications failed:", err);
    res.status(500).json({ message: "Error fetching applications" });
  }
});



router.get('/', async (req, res) => {
  try {
    const apps = await Application.find();
    res.status(200).json(apps);
  } catch (err) {
    res.status(500).json({ message: "Error fetching applications" });
  }
});

router.put('/reject/:id', async (req, res) => {
    try {
      console.log("Rejecting ID:", req.params.id); // Add this
      const app = await Application.findByIdAndUpdate(req.params.id, { status: 'Rejected' }, { new: true });
  
      if (!app) {
        console.log("❌ Application not found for ID:", req.params.id); // Add this
        return res.status(404).json({ message: 'Application not found' });
      }
  
      res.status(200).json({ message: 'Application rejected successfully', app });
    } catch (err) {
      console.error("❌ Reject failed:", err.message); // Add this
      res.status(500).json({ message: 'Error rejecting application', error: err.message });
    }
  });

export default router;
