import express from 'express';
import { 
  registerUser, 
  getUsersByRole, 
  updateUser, 
  login, 
  deleteUser, 
  forgotPassword, 
  resetPassword,
  getModuleHeadEvents,
  getModuleLeaderEvents,
  getEventParticipants,
  updateAttendance,
  updateGrade,
  promoteParticipant,
  getAllParticipants,
  getAllEvents,
  checkUserRole,
  checkEmailFormats,
  checkEventParticipantRelationship,
  updateParticipantModules,
  getUser
} from '../../controllers/moduleController/authController.js';
// import {login} from '../../controllers/adminController/authController.js';
// import jwt from 'jsonwebtoken';
const router = express.Router();

// POST route for user registration
router.post('/register', registerUser);
router.get('/role/:role', getUsersByRole);
// PUT route to update user (Admin only)
// PUT route for updating user (Admin only)
router.put('/update', updateUser);  // No need for userId in the URL

// POST route for login (for Module Head and Module Leader)
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// DELETE route to delete user (Admin only)
router.delete('/delete/:userId', deleteUser);
router.get("/user", getUser);    // User information route

// Routes for assigned events and participants
router.get('/module-head/events', getModuleHeadEvents);
router.get('/module-leader/events', getModuleLeaderEvents);
router.get('/event/participants', getEventParticipants);
router.get('/check-role', checkUserRole);

// Debug routes
router.get('/all-participants', getAllParticipants);
router.get('/all-events', getAllEvents);
router.get('/check-email-formats', checkEmailFormats);
router.get('/check-event-participant-relationship', checkEventParticipantRelationship);
router.get('/update-participant-modules', updateParticipantModules);

// Routes for participant management
router.put('/attendance/:id', updateAttendance);
router.put('/grades/:id', updateGrade);
router.put('/passToNextRound/:id', promoteParticipant);

export default router;
