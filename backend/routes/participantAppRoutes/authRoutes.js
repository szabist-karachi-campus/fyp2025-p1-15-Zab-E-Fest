import express from 'express';
import { getUserProfile, updateUserProfile, registerUser, loginUser, socialAuth , forgotPassword, resetPassword, resetPasswordWithCode} from '../../controllers/participantAppController/authController.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/social-auth', socialAuth);
// Example: get user info from token
router.get('/me', getUserProfile);
// Update user profile
router.put('/profile', updateUserProfile);


// Forgot password route
router.post('/forgot-password', forgotPassword);
// Reset password route
router.post('/reset-password/:token', resetPassword);
// Reset password with code route (for mobile app)
router.post('/reset-password-code', resetPasswordWithCode);
  

export default router;
