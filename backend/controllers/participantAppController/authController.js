import User from '../../models/participant_app/participantRegisterModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// NodeMailer Transporter Setup (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use Gmail as the email service
  auth: {
    user: process.env.EMAIL,  // Your email from .env
    pass: process.env.PASSWORD, // Your App Password from .env (recommended if 2FA enabled)
  },
  tls: {
    rejectUnauthorized: false,  // Allow non-authorized certificates (useful in development)
  },
});

// Register User
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const normalizedEmail = email.toLowerCase();

  // Basic email format validation (optional but recommended)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      userId: newUser._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });

    res.json({
      message: 'Login successful',
      token,
      userId: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Social Authentication (e.g., Google/Facebook)
export const socialAuth = async (req, res) => {
  const { email, name, provider } = req.body;
  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, password: '', name, provider });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });
    res.json({ token, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('name email mobile profileImage');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      name: user.name, 
      email: user.email,
      mobile: user.mobile || '',
      profileImage: user.profileImage || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { name, mobile } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (mobile) updateData.mobile = mobile;

    const user = await User.findByIdAndUpdate(
      decoded.userId, 
      updateData, 
      { new: true }
    ).select('name email mobile profileImage');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        name: user.name, 
        email: user.email,
        mobile: user.mobile || '',
        profileImage: user.profileImage || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Check if user exists (normalized)
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const mailOptions = {
      to: normalizedEmail,
      from: process.env.EMAIL,
      subject: 'Reset your Zab E‑Fest password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
          <h2>Zab E‑Fest – Password Reset</h2>
          <p>Hello${user.name ? ' ' + user.name : ''},</p>
          <p>We received a request to reset the password for your account. If you made this request, use the verification code below in the mobile app:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 20px 30px; background:#f3f4f6; border:2px solid #e5e7eb; border-radius:12px; font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">
              ${resetCode}
            </div>
          </div>
          
          <p style="text-align: center; color:#6b7280; font-size: 16px; margin: 20px 0;">
            <strong>Instructions:</strong><br/>
            Open the Zab E‑Fest app → Forgot Password → Enter this code
          </p>
          
          <p style="color:#6b7280; font-size: 14px;">For your security, this code expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          <p>— Zab E‑Fest Support</p>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email: ', error);
        return res.status(500).json({ message: 'Error sending email', error: error.message });
      }
      console.log('Email sent: ' + info.response);
      res.status(200).json({ message: 'Password reset code sent!' });
    });

  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    // Hash the new password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset Password with Code (for mobile app)
export const resetPasswordWithCode = async (req, res) => {
  const { email, code, password } = req.body;

  try {
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Find user with matching email and code
    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Hash the new password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
