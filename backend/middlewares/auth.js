import jwt from "jsonwebtoken";
import User from "../models/adminModels/user.js";
import dotenv from "dotenv";
dotenv.config();

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) throw new Error("No Bearer token provided");
  return token;
};

export const authenticateParticipant = async (req, res, next) => {
  try {
    const decoded = jwt.verify(getTokenFromHeader(req), process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role");
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    // Optionally restrict to participants: if (user.role !== 'Participant') ...
    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};

export const authenticateAdmin = async (req, res, next) => {
  try {
    const decoded = jwt.verify(getTokenFromHeader(req), process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role");
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (user.role !== "admin") return res.status(403).json({ message: "Admins only" });
    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};
