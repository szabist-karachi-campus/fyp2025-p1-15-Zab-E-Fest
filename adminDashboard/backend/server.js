// Importing necessary libraries
import express from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
// import bcrypt from 'bcryptjs';

// Import routes
import studentRoutes from './routes/registrationTeamRoutes/studentRoutes.js';
import authRoutes from './routes/participantAppRoutes/authRoutes.js';
import adminAuthRoutes from './routes/adminRoutes/authRoutes.js';
import participantRoutes from './routes/adminRoutes/participantRoutes.js';
import eventRoutes from './routes/adminRoutes/eventRoutes.js';
import moduleRoutes from './routes/adminRoutes/moduleRoutes.js';
import applicationRoutes from './routes/participantAppRoutes/applicationRoutes.js';
import moduleHeadRoutes from './routes/moduleRoutes/authRoutes.js';


// MongoDB connection setup
import connectDB from './config/db.js';

//uploads
import { fileURLToPath } from "url";

// These two lines replace __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize dotenv
dotenv.config();

// MongoDB connection
connectDB();

// Create Express app instance
const app = express();

// Ensure uploads directory exists
app.use("/uploads/payments", express.static(path.join(__dirname, "uploads/payments")));

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Debug middleware to log request details
const requestLogger = (req, res, next) => {
  console.log('--------------------------------------------------');
  console.log(`${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('--------------------------------------------------');
  next();
};

// Apply middleware
app.use(requestLogger); // Add request logger for debugging

// Register routes
app.use('/api/students', studentRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/participants', participantRoutes);

//participant Api for mobile application
app.use('/api/auth', authRoutes);
app.use("/api/apply-module", applicationRoutes);

//Moudle Head and Module Leader Api
// Use routes
app.use('/api/moduleRole', moduleHeadRoutes);



// Password hashing example (for testing)
// const generateHashedPassword = async () => {
//   const plainPassword = 'password123'; // Replace with desired password
//   const hashedPassword = await bcrypt.hash(plainPassword, 10);
//   console.log('Hashed Password:', hashedPassword);
// };

// // Generate hashed password once at startup
// generateHashedPassword();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
