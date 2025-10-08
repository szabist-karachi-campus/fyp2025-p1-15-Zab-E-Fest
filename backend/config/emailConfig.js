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

// Send application rejection email
export const sendRejectionEmail = async (to, applicationData) => {
  const { moduleTitle, participants, registrationToken } = applicationData;
  
  const mailOptions = {
    from: process.env.EMAIL,
    to: to,
    subject: `Application Rejected - ${moduleTitle} - Zab E-Fest Event Management`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Zab E-Fest Event Management</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
          <h3 style="color: #d32f2f;">Application Rejected</h3>
          <p>Dear Participant,</p>
          <p>We regret to inform you that your application for the following module has been rejected:</p>
          
          <div style="background-color: #fff; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Module Details:</h4>
            <p style="margin: 5px 0;"><strong>Module:</strong> ${moduleTitle}</p>
            <p style="margin: 5px 0;"><strong>Registration Token:</strong> ${registrationToken}</p>
          </div>
          
          <div style="background-color: #fff; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Participant Details:</h4>
            ${participants.map(participant => `
              <div style="margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
                <p style="margin: 2px 0;"><strong>Name:</strong> ${participant.name}</p>
                <p style="margin: 2px 0;"><strong>Roll Number:</strong> ${participant.rollNumber}</p>
                <p style="margin: 2px 0;"><strong>Email:</strong> ${participant.email}</p>
                <p style="margin: 2px 0;"><strong>University:</strong> ${participant.university}</p>
                <p style="margin: 2px 0;"><strong>Department:</strong> ${participant.department}</p>
              </div>
            `).join('')}
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">Important Information:</h4>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>Your application has been reviewed and unfortunately could not be approved at this time.</li>
              <li>If you believe this is an error, please contact our support team.</li>
              <li>You may apply for other available modules if interested.</li>
              <li>Any payment made will be refunded according to our refund policy.</li>
            </ul>
          </div>
          
          <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
          <p>Thank you for your interest in Zab E-Fest Event Management.</p>
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
    console.error('Rejection email sending error:', error);
    return { success: false, error };
  }
};

export default transporter; 