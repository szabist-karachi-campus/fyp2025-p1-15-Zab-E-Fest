import mongoose from "mongoose";
import Student from "../../models/adminModels/participant.js";

export const registerStudent = async (req, res) => {
  try {
    const { name, email, contactNumber, university, rollNumber, department, module, fee } = req.body;

    // Convert feesPaid to a boolean
    const student = new Student({
      name,
      email, 
      contactNumber,
      university,
      rollNumber,
      department,
      module, // Ensure this is an array
      fee: Number(fee) 
    });

    const savedStudent = await student.save(); // Save to MongoDB
    res.status(201).json(savedStudent);
  } catch (error) {
    console.error("Error saving student:", error);
    res.status(500).json({ message: "Failed to register student" });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params; // Extract student ID
    let updatedData = req.body; // Extract data from request

    // If 'fee' missing or null, fetch existing student's fee
    if (updatedData.fee === undefined || updatedData.fee === null) {
      const existingStudent = await Student.findById(id);
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      updatedData.fee = existingStudent.fee;
    }

    const updatedStudent = await Student.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Failed to update student" });
  }
};


export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params; // Extract student ID from the URL

    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Failed to delete student" });
  }
};

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Error fetching students" });
  }
};