import express from 'express';
import { getUserProfile,registerUser, loginUser, socialAuth , forgotPassword, resetPassword} from '../../controllers/participantAppController/authController.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/social-auth', socialAuth);
// Example: get user info from token
router.get('/me', getUserProfile);


// Forgot password route
router.post('/forgot-password', forgotPassword);
// Reset password route
router.post('/reset-password/:token', resetPassword);
  

export default router;
