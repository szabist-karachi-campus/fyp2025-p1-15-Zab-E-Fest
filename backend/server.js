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
import notificationRoutes from './routes/adminRoutes/notificationRoutes.js';
import participantNotificationRoutes from './routes/participantAppRoutes/notificationRoutes.js';
import participantroot from './routes/participantRoutes.js';


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

// Minimal HTML page for password reset via browser
app.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  const html = `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Zab E‑Fest – Reset Password</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background:#f6f7fb; margin:0; }
      .wrap { max-width: 440px; margin: 48px auto; padding: 24px; background:#fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
      h1 { font-size: 20px; margin: 0 0 4px; color:#1f2937; }
      p { margin: 8px 0 16px; color:#4b5563; }
      label { display:block; font-size: 14px; color:#374151; margin-bottom: 6px; }
      input { width: 100%; padding: 12px 180px; border:1px solid #e5e7eb; border-radius: 8px; font-size: 14px; }
      button { width: 100%; padding: 12px 14px; background:#4f46e5; color:#fff; border:0; border-radius: 10px; font-weight: 600; cursor:pointer; }
      button:disabled { opacity:.6; cursor:not-allowed; }
      .hint { font-size: 12px; color:#6b7280; margin-top: 10px; }
      .footer { text-align:center; margin-top: 16px; font-size: 12px; color:#6b7280; }
      .logo { display:flex; align-items:center; gap:10px; margin-bottom: 12px; }
      .logo span { font-weight: 700; color:#4338ca; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="logo"><span>Zab E‑Fest</span></div>
      <h1>Reset your password</h1>
      <p>Enter a new password for your account. This link will expire after a short time.</p>
      <form id="resetForm" method="post" action="/api/auth/reset-password/${token}">
        <label for="password">New password</label>
        <div style="display:flex; gap:8px; align-items:center;">
          <input id="password" name="password" type="password" minlength="6" required placeholder="At least 6 characters" style="flex:1; background:#fff; color:#111827;" autocomplete="new-password" autocapitalize="none" spellcheck="false" inputmode="text" tabindex="0" />
          <button id="toggleBtn" type="button" style="padding:10px 12px; background:#eef2ff; color:#4338ca; border:1px solid #0b0d11ff; border-radius:8px; font-weight:600;">Show</button>
        </div>
        <div class="hint">Tip: Use a strong, unique password.</div>
        <div style="height:14px"></div>
        <button id="submitBtn" type="submit">Update password</button>
      </form>
      <div id="msg" class="hint" style="margin-top:12px; display:none;"></div>
      <div class="footer">If you installed the mobile app, you can also paste this token there: <code>${token}</code></div>
    </div>
    <script>
      const form = document.getElementById('resetForm');
      const btn = document.getElementById('submitBtn');
      const msg = document.getElementById('msg');
      const pwd = document.getElementById('password');
      const toggleBtn = document.getElementById('toggleBtn');

      // Ensure the field is ready for input on load
      window.addEventListener('load', () => {
        try { pwd.focus({ preventScroll: true }); } catch (_) {}
        // Explicitly remove any accidental readOnly or disabled flags
        pwd.readOnly = false; pwd.disabled = false; pwd.style.pointerEvents = 'auto';
      });

      toggleBtn.addEventListener('click', () => {
        const hidden = pwd.type === 'password';
        pwd.type = hidden ? 'text' : 'password';
        toggleBtn.textContent = hidden ? 'Hide' : 'Show';
      });

      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        if (!pwd.value || pwd.value.length < 6) {
          msg.style.display = 'block';
          msg.textContent = 'Password must be at least 6 characters.';
          return;
        }
        btn.disabled = true; btn.textContent = 'Updating...'; msg.style.display = 'none';
        try {
          const r = await fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd.value })
          });
          if (r.ok) {
            msg.style.display = 'block';
            msg.textContent = 'Password reset successful. Redirecting to app sign-in...';
            // Attempt to open the mobile app (requires deep link intent on device)
            setTimeout(() => { window.location.href = 'zabefest://auth'; }, 300);
            // Fallback, re-enable the button after a moment
            setTimeout(() => { btn.disabled = false; btn.textContent = 'Update password'; }, 2000);
          } else {
            const t = await r.text();
            msg.style.display = 'block';
            msg.textContent = 'Failed: ' + (t || r.status);
            btn.disabled = false; btn.textContent = 'Update password';
          }
        } catch (e) {
          msg.style.display = 'block';
          msg.textContent = 'Error: ' + e;
          btn.disabled = false; btn.textContent = 'Update password';
        }
      });
    </script>
  </body>
  </html>`;
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
});

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
app.use("/api/notifications", notificationRoutes);
app.use("/api/notifications", participantNotificationRoutes);
app.use('/api/partData', participantroot);



// Password hashing example (for testing)
// const generateHashedPassword = async () => {
//   const plainPassword = 'password123'; // Replace with desired password
//   const hashedPassword = await bcrypt.hash(plainPassword, 10);
//   console.log('Hashed Password:', hashedPassword);
// };

// // Generate hashed password once at startup
// generateHashedPassword();

// Start Servera
const PORT = process.env.PORT || 5000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
