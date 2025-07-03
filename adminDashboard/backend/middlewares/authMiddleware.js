import jwt from 'jsonwebtoken';

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