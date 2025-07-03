import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Admin from "../../models/adminModels/user.js"; // Admin model
import User from "../../models/registrationTeamModels/User.js"; // Registration Team model
import { sendPasswordResetEmail } from "../../config/emailConfig.js";

// Universal Login Handler
export const login = async (req, res) => {
  const { email, password, role } = req.body; // Get email, password, and role from body

  try {
    let user;
    // Check if the role is admin or registrationTeam
    if (role === "admin") {
      user = await Admin.findOne({ email });
    } else if (role === "registrationTeam") {
      user = await User.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid role" }); // If role is invalid
    }

    if (!user) {
      return res.status(404).json({ message: `${role} not found` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create token with user ID (fixed)
    const token = jwt.sign({ id: user._id, role: role }, process.env.JWT_SECRET, {
      expiresIn: "10h",
    });

    console.log('Login successful:', {
      userId: user._id,
      role: role,
      tokenGenerated: !!token
    });

    // Send back token, user data, and role
    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
      role,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password for Admin or Registration Team
export const forgotPassword = async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ message: "Email and role are required" });
  }

  try {
    let user;
    let userRole = role;

    // Find the user based on role
    if (role === "admin") {
      user = await Admin.findOne({ email });
    } else if (role === "registrationTeam") {
      user = await User.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Save token to database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    // Send password reset email
    const emailResponse = await sendPasswordResetEmail(email, resetToken, userRole);

    if (!emailResponse.success) {
      return res.status(500).json({ message: "Failed to send reset email" });
    }

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reset Password for Admin or Registration Team
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, role } = req.body;

  if (!token || !password || !role) {
    return res.status(400).json({ message: "Token, password and role are required" });
  }

  try {
    let user;

    // Find user with valid reset token based on role
    if (role === "admin") {
      user = await Admin.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });
    } else if (role === "registrationTeam") {
      user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired password reset token" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update user's password
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error creating user" });
  }
};

// Change Password (requires authentication)
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  console.log('Change Password - Request body:', { currentPassword: 'FILTERED', newPassword: 'FILTERED' });
  console.log('Change Password - Request user:', req.user);
  
  // Extract user information from request
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  console.log('Change Password - Extracted userId:', userId, 'role:', userRole);

  try {
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }

    // Find user based on role and ID
    let user;
    if (userRole === "admin") {
      user = await Admin.findById(userId);
    } else if (userRole === "registrationTeam") {
      user = await User.findById(userId);
    } else {
      return res.status(400).json({ message: "Invalid user role" });
    }

    if (!user) {
      console.log('Change Password - User not found for ID:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('Change Password - User found:', { id: user._id, role: userRole });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      console.log('Change Password - Incorrect password for user:', userId);
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();
    console.log('Change Password - Password updated successfully for user:', userId);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Profile (name and email)
export const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  console.log('Update Profile - Request body:', { name, email });
  console.log('Update Profile - Request user:', req.user);
  
  // Extract user information from request
  const userId = req.user?.id;
  const userRole = req.user?.role;
  
  console.log('Update Profile - Extracted userId:', userId, 'role:', userRole);

  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    // Find user based on role and ID
    let user;
    if (userRole === "admin") {
      user = await Admin.findById(userId);
      console.log('Update Profile - Looking for admin user:', userId);
    } else if (userRole === "registrationTeam") {
      user = await User.findById(userId);
      console.log('Update Profile - Looking for registration team user:', userId);
    } else {
      return res.status(400).json({ message: "Invalid user role" });
    }

    if (!user) {
      console.log('Update Profile - User not found for ID:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log('Update Profile - User found:', { id: user._id, name: user.name, email: user.email });

    // Check if the email is being changed and ensure it's unique
    if (email && email !== user.email) {
      const emailExists = await (userRole === "admin" 
        ? Admin.findOne({ email, _id: { $ne: userId } })
        : User.findOne({ email, _id: { $ne: userId } })
      );
      
      if (emailExists) {
        console.log('Update Profile - Email already exists:', email);
        return res.status(400).json({ message: "Email is already in use" });
      }
      
      user.email = email;
      console.log('Update Profile - Email updated to:', email);
    }

    // Update name if provided
    if (name) {
      user.name = name;
      console.log('Update Profile - Name updated to:', name);
    }

    await user.save();
    console.log('Update Profile - Profile updated successfully');

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  const userId = req.params.id || req.user.id; // From URL params or auth middleware
  const userRole = req.user.role; // This should come from auth middleware

  try {
    // Find user based on role and ID
    let user;
    if (userRole === "admin") {
      user = await Admin.findById(userId).select("-password -resetPasswordToken -resetPasswordExpires");
    } else if (userRole === "registrationTeam") {
      user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpires");
    } else {
      return res.status(400).json({ message: "Invalid user role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Profile Image
export const updateProfileImage = async (req, res) => {
  const userId = req.user.id; // This should come from auth middleware
  const userRole = req.user.role; // This should come from auth middleware
  
  try {
    // Check if file exists in request
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }
    
    // Find user based on role and ID
    let user;
    if (userRole === "admin") {
      user = await Admin.findById(userId);
    } else if (userRole === "registrationTeam") {
      user = await User.findById(userId);
    } else {
      return res.status(400).json({ message: "Invalid user role" });
    }
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Assuming you're storing the file path
    const profileImagePath = req.file.path;
    
    // Update profile image field (you may need to add this field to your model)
    user.profileImage = profileImagePath;
    await user.save();
    
    res.status(200).json({
      message: "Profile image updated successfully",
      profileImage: profileImagePath
    });
  } catch (error) {
    console.error("Update Profile Image Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
