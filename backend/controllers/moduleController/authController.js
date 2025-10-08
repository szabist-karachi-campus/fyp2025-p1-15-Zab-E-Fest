import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';  // Import jsonwebtoken library
import User from '../../models/moduleModels/user.js'; // Assuming the User model
import Participant from "../../models/adminModels/participant.js"; // Adjust path if needed
import Event from "../../models/adminModels/event.js"; // Import Event model
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../../config/emailConfig.js';


// Register a new user with specific role (Module Head or Module Leader)
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Module Head and Module Leader with this email already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'ModuleHead', // Default role as 'Module Head'
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
};




export const getUsersByRole = async (req, res) => {
  const { role } = req.params; // Module Head or Module Leader

  try {
    const users = await User.find({ role }); // Filter by role
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

// Update password for a specific user (admin only)
// In authController.js
// Update user details (Admin only)
export const updateUser = async (req, res) => {
  const { userId, name, email, password, role } = req.body;

  // Validate user ID
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields if they are provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    // If password is provided, hash it and update
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      user.password = hashedPassword;
    }

    // Save updated user
    await user.save();

    // Respond with the updated user
    res.status(200).json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Error updating user", error: err.message });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
  const { userId } = req.params; // Get user ID from params

  try {
    // Find and delete the user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
};

// Login function for Module Head and Module Leader
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user exists
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if the user is assigned to any events as a module head or leader by email or name
    let assignedEvents = [];
    if (role === 'ModuleHead') {
      // Try by email first
      assignedEvents = await Event.find({ 
        moduleHead: { $regex: new RegExp('^' + email + '$', 'i') } 
      });
      
      // If no events found by email, try by name
      if (assignedEvents.length === 0) {
        assignedEvents = await Event.find({ 
          moduleHead: { $regex: new RegExp('^' + user.name + '$', 'i') } 
        });
      }
    } else if (role === 'ModuleLeader') {
      // Try by email first
      assignedEvents = await Event.find({ 
        moduleLeader: { $regex: new RegExp('^' + email + '$', 'i') } 
      });
      
      // If no events found by email, try by name
      if (assignedEvents.length === 0) {
        assignedEvents = await Event.find({ 
          moduleLeader: { $regex: new RegExp('^' + user.name + '$', 'i') } 
        });
      }
    }

    console.log(`User ${email} (${user.name}) with role ${role} has ${assignedEvents.length} assigned events`);

    // Create and send JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedEvents: assignedEvents.map(e => ({
          id: e._id,
          title: e.title,
          date: e.date,
          location: e.location
        }))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// GET /api/auth/user?email=<email>
export const getUserByEmail = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "email query required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    // return only what we need
    return res.json({ name: user.name, email: user.email });
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password functionality for module users
export const forgotPassword = async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ message: "Email and role are required" });
  }

  try {
    // Find the user
    const user = await User.findOne({ email, role });
    
    if (!user) {
      return res.status(404).json({ message: "User not found with this email and role" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Save token to database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    // Send password reset email
    const emailResponse = await sendPasswordResetEmail(email, resetToken, role);

    if (!emailResponse.success) {
      return res.status(500).json({ message: "Failed to send reset email" });
    }

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reset Password functionality for module users
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, role } = req.body;

  if (!token || !password || !role) {
    return res.status(400).json({ message: "Token, password and role are required" });
  }

  try {
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
      role: role
    });

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

// Get events assigned to module head
export const getModuleHeadEvents = async (req, res) => {
  try {
    const { email, name } = req.query;
    
    if (!email && !name) {
      return res.status(400).json({ message: "Email or name is required" });
    }
    
    let events = [];
    
    // Try to find events by email first (case insensitive)
    if (email) {
      console.log(`Looking for events assigned to module head by email: ${email}`);
      events = await Event.find({ 
        moduleHead: { $regex: new RegExp('^' + email + '$', 'i') } 
      });
      console.log(`Found ${events.length} events for module head by email: ${email}`);
    }
    
    // If no events found by email or only name provided, try by name
    if ((events.length === 0 || !email) && name) {
      console.log(`Looking for events assigned to module head by name: ${name}`);
      events = await Event.find({ 
        moduleHead: { $regex: new RegExp('^' + name + '$', 'i') } 
      });
      console.log(`Found ${events.length} events for module head by name: ${name}`);
    }
    
    // Return empty array instead of 404 when no events are found
    return res.status(200).json({ events: events || [] });
  } catch (error) {
    console.error("Error fetching module head events:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get events assigned to module leader
export const getModuleLeaderEvents = async (req, res) => {
  try {
    const { email, name } = req.query;
    
    if (!email && !name) {
      return res.status(400).json({ message: "Email or name is required" });
    }
    
    let events = [];
    
    // Try to find events by email first (case insensitive)
    if (email) {
      console.log(`Looking for events assigned to module leader by email: ${email}`);
      events = await Event.find({ 
        moduleLeader: { $regex: new RegExp('^' + email + '$', 'i') } 
      });
      console.log(`Found ${events.length} events for module leader by email: ${email}`);
    }
    
    // If no events found by email or only name provided, try by name
    if ((events.length === 0 || !email) && name) {
      console.log(`Looking for events assigned to module leader by name: ${name}`);
      events = await Event.find({ 
        moduleLeader: { $regex: new RegExp('^' + name + '$', 'i') } 
      });
      console.log(`Found ${events.length} events for module leader by name: ${name}`);
    }
    
    // Return empty array instead of 404 when no events are found
    return res.status(200).json({ events: events || [] });
  } catch (error) {
    console.error("Error fetching module leader events:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get participants for a specific event (pre-qualifier round)
export const getEventParticipants = async (req, res) => {
  try {
    const { eventTitle } = req.query;
    
    if (!eventTitle) {
      return res.status(400).json({ message: "Event title is required" });
    }
    
    // Find the event to get its details
    const event = await Event.findOne({ title: eventTitle });
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    console.log(`Looking for participants for event: ${eventTitle}`);
    
    // Different strategies to find participants for this event
    // 1. Exact match on module field
    let participants = await Participant.find({ module: eventTitle });
    console.log(`Found ${participants.length} participants with exact module match`);
    
    // 2. If no participants found, try case-insensitive match
    if (participants.length === 0) {
      participants = await Participant.find({ 
        module: { $regex: new RegExp('^' + eventTitle + '$', 'i') } 
      });
      console.log(`Found ${participants.length} participants with case-insensitive module match`);
    }
    
    // 3. If still no participants, try partial match
    if (participants.length === 0) {
      participants = await Participant.find({ 
        module: { $regex: eventTitle, $options: 'i' } 
      });
      console.log(`Found ${participants.length} participants with partial module match`);
    }
    
    // Return participants (empty array if none found) and event details
    return res.status(200).json({ 
      participants: participants || [],
      eventDetails: {
        title: event.title,
        date: event.date,
        location: event.location,
        moduleHead: event.moduleHead,
        moduleLeader: event.moduleLeader
      }
    });
  } catch (error) {
    console.error("Error fetching event participants:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update attendance for a participant
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendance, notes } = req.body;
    
    if (!id || !attendance) {
      return res.status(400).json({ message: "Participant ID and attendance value are required" });
    }
    
    // Find and update the participant
    const participant = await Participant.findByIdAndUpdate(
      id,
      { attendance, notes },
      { new: true }
    );
    
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    
    res.status(200).json({ 
      message: "Attendance updated successfully", 
      attendance: participant.attendance 
    });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update grade for a participant
export const updateGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, comments } = req.body;
    
    if (!id || !grade) {
      return res.status(400).json({ message: "Participant ID and grade value are required" });
    }
    
    // Find and update the participant
    const participant = await Participant.findByIdAndUpdate(
      id,
      { grade, comments },
      { new: true }
    );
    
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    
    res.status(200).json(participant);
  } catch (error) {
    console.error("Error updating grade:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Promote participant to next round based on grade
export const promoteParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { minGradeRequired } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: "Participant ID is required" });
    }
    
    const participant = await Participant.findById(id);
    
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }
    
    // Check if participant has a grade
    if (!participant.grade) {
      return res.status(400).json({ message: "Participant must have a grade before promotion" });
    }
    
    // Convert grade to number for comparison (assuming grades are numeric)
    const numericGrade = parseFloat(participant.grade);
    
    // If minGradeRequired is provided, check if participant meets the requirement
    if (minGradeRequired && numericGrade < parseFloat(minGradeRequired)) {
      return res.status(400).json({ 
        message: `Cannot promote: Grade ${numericGrade} is below minimum requirement of ${minGradeRequired}` 
      });
    }
    
    // Logic to promote participant to next round
    const stages = ["Pre-Qualifier", "Final Round", "Winner"];
    const currentStageIndex = stages.indexOf(participant.stage || "Pre-Qualifier");
    
    if (currentStageIndex >= stages.length - 1) {
      return res.status(400).json({ message: "Participant is already at the final stage" });
    }
    
    const nextStage = stages[currentStageIndex + 1];
    
    const updatedParticipant = await Participant.findByIdAndUpdate(
      id,
      { stage: nextStage },
      { new: true }
    );
    
    res.status(200).json({
      message: `Participant promoted to ${nextStage}`,
      participant: updatedParticipant
    });
  } catch (error) {
    console.error("Error promoting participant:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Debug function to get all participants
export const getAllParticipants = async (req, res) => {
  try {
    const participants = await Participant.find();
    
    console.log(`Total participants found: ${participants.length}`);
    console.log('Participants modules:', participants.map(p => p.module));
    
    res.status(200).json({ 
      participants,
      count: participants.length,
      modules: [...new Set(participants.map(p => p.module))]
    });
  } catch (error) {
    console.error("Error fetching all participants:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Debug function to get all events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    
    console.log(`Total events found: ${events.length}`);
    console.log('Event moduleHeads:', events.map(e => e.moduleHead));
    console.log('Event moduleLeaders:', events.map(e => e.moduleLeader));
    
    res.status(200).json({ 
      events,
      count: events.length,
      moduleHeads: [...new Set(events.map(e => e.moduleHead))],
      moduleLeaders: [...new Set(events.map(e => e.moduleLeader))]
    });
  } catch (error) {
    console.error("Error fetching all events:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Check if a user is a module head or leader in any event
export const checkUserRole = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Find events where this user is assigned as module head or leader (case insensitive)
    const asHead = await Event.find({ 
      moduleHead: { $regex: new RegExp('^' + email + '$', 'i') } 
    });
    
    const asLeader = await Event.find({ 
      moduleLeader: { $regex: new RegExp('^' + email + '$', 'i') } 
    });
    
    console.log(`User ${email} is head for ${asHead.length} events and leader for ${asLeader.length} events`);
    
    res.status(200).json({
      isModuleHead: asHead.length > 0,
      isModuleLeader: asLeader.length > 0,
      headEvents: asHead.map(e => e.title),
      leaderEvents: asLeader.map(e => e.title)
    });
  } catch (error) {
    console.error("Error checking user role:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Debug function to check email formats in events
export const checkEmailFormats = async (req, res) => {
  try {
    const events = await Event.find();
    
    const emailCheck = events.map(event => ({
      eventId: event._id,
      title: event.title,
      moduleHead: {
        email: event.moduleHead,
        hasAt: event.moduleHead.includes('@'),
        isLowerCase: event.moduleHead === event.moduleHead.toLowerCase()
      },
      moduleLeader: {
        email: event.moduleLeader,
        hasAt: event.moduleLeader.includes('@'),
        isLowerCase: event.moduleLeader === event.moduleLeader.toLowerCase()
      }
    }));
    
    res.status(200).json({ 
      emailCheck,
      count: events.length
    });
  } catch (error) {
    console.error("Error checking email formats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Debug function to check the relationship between events and participants
export const checkEventParticipantRelationship = async (req, res) => {
  try {
    const events = await Event.find();
    const participants = await Participant.find();
    
    const eventTitles = events.map(e => e.title);
    const participantModules = [...new Set(participants.map(p => p.module))];
    
    // Check which event titles match with participant modules
    const matches = [];
    const mismatches = [];
    
    eventTitles.forEach(title => {
      const matchingParticipants = participants.filter(p => 
        p.module === title || 
        p.module.toLowerCase() === title.toLowerCase()
      );
      
      if (matchingParticipants.length > 0) {
        matches.push({
          eventTitle: title,
          participantCount: matchingParticipants.length
        });
      } else {
        mismatches.push(title);
      }
    });
    
    // Check for participant modules that don't match any event
    const orphanedModules = participantModules.filter(module => 
      !eventTitles.some(title => 
        title === module || 
        title.toLowerCase() === module.toLowerCase()
      )
    );
    
    res.status(200).json({
      events: {
        count: events.length,
        titles: eventTitles
      },
      participants: {
        count: participants.length,
        modules: participantModules
      },
      matches,
      mismatches,
      orphanedModules
    });
  } catch (error) {
    console.error("Error checking event-participant relationship:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Debug function to update participant modules to match event titles
export const updateParticipantModules = async (req, res) => {
  try {
    const { eventTitle, newModuleName } = req.query;
    
    if (!eventTitle || !newModuleName) {
      return res.status(400).json({ message: "Event title and new module name are required" });
    }
    
    // Find participants with the given module name (case insensitive)
    const participants = await Participant.find({
      module: { $regex: new RegExp(eventTitle, 'i') }
    });
    
    if (participants.length === 0) {
      return res.status(404).json({ message: "No participants found with this module name" });
    }
    
    // Update all matching participants
    const updatePromises = participants.map(participant => 
      Participant.findByIdAndUpdate(
        participant._id,
        { module: newModuleName },
        { new: true }
      )
    );
    
    const updatedParticipants = await Promise.all(updatePromises);
    
    res.status(200).json({
      message: `Updated ${updatedParticipants.length} participants`,
      updatedParticipants
    });
  } catch (error) {
    console.error("Error updating participant modules:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user by email
export const getUser = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return only necessary user information
    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




