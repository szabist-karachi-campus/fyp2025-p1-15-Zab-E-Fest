// middlewares/moduleMiddleware/moduleMiddleware.js

import jwt from 'jsonwebtoken';

const moduleMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Verify the token. Make sure JWT_SECRET is set in your environment.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to req.user for downstream handlers
    req.user = {
      email: payload.email,
      id: payload.sub || payload.id
    };

    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default moduleMiddleware;
