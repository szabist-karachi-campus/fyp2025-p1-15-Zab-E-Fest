import jwt from 'jsonwebtoken';

const authMiddleware = (role) => (req, res, next) => {
  const token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;

    // Check if the user has the required role
    if (req.user.role !== role) {
      return res.status(403).json({ msg: "Access forbidden: insufficient role" });
    }

    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

export default authMiddleware;