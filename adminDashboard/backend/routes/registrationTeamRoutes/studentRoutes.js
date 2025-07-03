import express from "express";
import {  updateStudent, deleteStudent } from "../../controllers/registrationTeamController/studentController.js";
// import authMiddleware from "../../middlewares/registrationTeamMiddleware/authMiddleware.js";

const router = express.Router();

// POST: Register a student (Protected)
// router.post("/register", authMiddleware, registerStudent);

// GET: Fetch all students (Protected)
// router.get("/", authMiddleware, getStudents);
router.put("/:id", updateStudent); // Update student by ID
router.delete("/:id", deleteStudent); // Delete student by ID

export default router;