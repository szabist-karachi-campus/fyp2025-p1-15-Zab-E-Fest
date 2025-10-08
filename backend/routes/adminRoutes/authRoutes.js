import express from "express";
import multer from "multer";
import path from "path";
import { 
  login, 
  register, 
  forgotPassword, 
  resetPassword,
  changePassword,
  updateProfile,
  getProfile,
  updateProfileImage
} from "../../controllers/adminController/authController.js";
import { authMiddleware } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  }
});

// Public routes
router.post("/login", login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes (require authentication)
router.post("/change-password", authMiddleware, changePassword);
router.post("/update-profile", authMiddleware, updateProfile);
router.get("/profile/:id?", authMiddleware, getProfile);
router.post("/update-profile-image", authMiddleware, upload.single("profileImage"), updateProfileImage);

export default router;
