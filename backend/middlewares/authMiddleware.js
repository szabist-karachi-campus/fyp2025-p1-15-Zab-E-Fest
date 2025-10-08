import jwt from 'jsonwebtoken';
import Participant from "../models/adminModels/participant.js"; // Student schema
import ParticipantUser from "../models/participant_app/participantRegisterModel.js"; // Mobile app user schema

/**
 * Authentication middleware that verifies JWT tokens and extracts user information
 * Can be used for all user types (admin, registrationTeam, etc.)
 */
export const authMiddleware = (req, res, next) => {
  // Get token from different header formats
  const authHeader = req.header('Authorization') || req.header('x-auth-token');
  let token;
  
  if (authHeader) {
    // Check if token has Bearer prefix
    token = authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : authHeader;
  }

  console.log('Auth Middleware - Token received:', token ? 'Yes' : 'No');
  
  // Check if no token
  if (!token) {
    console.log('Auth Middleware - No token provided');
    return res.status(401).json({ message: 'No authentication token, access denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth Middleware - Decoded token:', decoded);
    
    // Set user data in request
    req.user = {
      id: decoded.id,
      role: decoded.role
    };
    
    console.log('Auth Middleware - User set:', req.user);
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
export const roleAuth = (roles = []) => {
  return (req, res, next) => {
    // First apply auth middleware to get user data
    authMiddleware(req, res, () => {
      // If no roles specified or user role is included in allowed roles
      if (roles.length === 0 || roles.includes(req.user.role)) {
        return next();
      }
      
      // If user role is not allowed
      return res.status(403).json({ 
        message: 'Access forbidden: You do not have permission to perform this action' 
      });
    });
  };
}; 

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Two token shapes are possible:
      // 1) Admin/legacy tokens with { id }
      // 2) Mobile participant tokens with { userId }
      if (decoded.userId) {
        // For participant app users
        const user = await ParticipantUser.findById(decoded.userId).select("name email");
        if (!user) {
          console.error('User not found for userId:', decoded.userId);
          return res.status(401).json({ message: "User not found" });
        }
        
        // Set user data in request
        req.user = {
          _id: user._id,  // Required for notification read status
          email: user.email,
          name: user.name,
          roles: ['Participant']  // Default role for mobile app users
        };

        console.log('Participant user authenticated:', {
          userId: req.user._id.toString(),
          email: req.user.email,
          roles: req.user.roles
        });

        return next();
      }

      if (decoded.id) {
        const participant = await Participant.findById(decoded.id).select("-password");
        if (!participant) {
          return res.status(401).json({ message: "User not found" });
        }
        req.user = participant;
        return next();
      }

      return res.status(401).json({ message: "Invalid token payload" });
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};