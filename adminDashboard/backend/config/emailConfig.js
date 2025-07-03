import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Accept self-signed certificates
  },
});

// Send password reset email
export const sendPasswordResetEmail = async (to, resetToken, userRole) => {
  // Base frontend URL - should be configured based on environment
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Path for password reset based on user role
  const resetUrl = `${baseUrl}/reset-password/${resetToken}?role=${userRole}`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: to,
    subject: 'Password Reset - Zab E-Fest Event Management',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Zab E-Fest Event Management</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <h3 style="color: #444;">Password Reset Request</h3>
          <p>You requested a password reset for your ${userRole} account.</p>
          <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Your Password
            </a>
          </div>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all;">${resetUrl}</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Zab E-Fest Event Management. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error };
  }
};

export default transporter; 