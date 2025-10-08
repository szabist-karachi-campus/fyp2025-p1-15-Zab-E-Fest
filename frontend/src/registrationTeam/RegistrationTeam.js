import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  //Checkbox,
  // ListItemText,
} from "@mui/material";
import { registerStudent, getStudents, updateStudent, deleteStudent } from "./api";
import { useNavigate } from "react-router-dom";
import './RegistrationTeam.css';  // Import the CSS file
import { logout } from "../state/authSlice";
import { useDispatch } from "react-redux";


const RegistrationTeam = () => {
  const dispatch = useDispatch();
  
  const navigate = useNavigate(); // useNavigate hook for redirection
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNumber: "",
    university: "",
    rollNumber: "",
    department: "",
    module:"",
    fee: 0,
  });
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState("");
  const [events, setEvents] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null); // Track the student being edited

  // Fetch students on component mount
  useEffect(() => {
     const fetchEvents = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/events");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Error loading events:", err);
      }
    };
   
    const fetchStudents = async () => {
      try {
        const data = await getStudents(); // Fetch all students
        console.log("Fetched Students:", data);  // Log to check the response
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchEvents();
    fetchStudents();
  },
   []);
  // Fetch modules & finalFee from backend


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...formData,
        fee: Number(formData.fee),
      };

      if (editingStudentId) {
        // If editing, update the student
        const updatedStudent = await updateStudent(editingStudentId, formattedData);
        setStudents((prev) =>
          prev.map((student) =>
            student._id === editingStudentId ? updatedStudent : student
          )
        );
        setMessage("Student updated successfully!");
      } else {
        // If adding new, register the student
        const newStudent = await registerStudent(formattedData);
        setStudents([...students, newStudent]);
        setMessage("Student registered successfully! A confirmation email has been sent.");
      }

      // Reset form and editing state
      setFormData({
        name: "",
        email: "",
        contactNumber: "",
        university: "",
        rollNumber: "",
        department: "",
        module: [],
        feesPaid: "",
      });
      setEditingStudentId(null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (student) => {
    // Populate form with student data for editing
    setFormData({
      name: student.name,
      email: student.email,
      contactNumber: student.contactNumber,
      university: student.university,
      rollNumber: student.rollNumber,
      department: student.department,
      module: student.module,
      feesPaid: student.feesPaid ? "Yes" : "No",
    });
    setEditingStudentId(student._id); // Set editing state
  };

  const handleDelete = async (studentId) => {
    try {
      await deleteStudent(studentId); // Call delete API
      setStudents((prev) => prev.filter((student) => student._id !== studentId));
      setMessage("Student deleted successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Deletion failed");
    }
  };

  const handleLogout = () => {
    dispatch(logout()); // Clear auth state from Redux
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login"); // Redirect to login page after logout
  };
  // const moduleOptions = [
  //   "Hackathon",
  //   "Speed Coding",
  //   "AI Bootcamp",
  //   "Web Tech",
  //   "Mobile Development",
  //   "Debugging Competitions",
  // ];

  return (
    <Box className="container">
      <Button
        variant="outlined"
        // color="secondary"
        
        onClick={handleLogout}
        className="logout-button"
      >
        Logout
      </Button>
      <Typography variant="h4" className="heading">
        {editingStudentId ? "Update Student" : "Register Student"}
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        className="form-container"
      >
        <TextField
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Contact Number"
          value={formData.contactNumber}
          onChange={(e) =>
            setFormData({ ...formData, contactNumber: e.target.value })
          }
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="University"
          value={formData.university}
          onChange={(e) =>
            setFormData({ ...formData, university: e.target.value })
          }
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Roll Number"
          value={formData.rollNumber}
          onChange={(e) =>
            setFormData({ ...formData, rollNumber: e.target.value })
          }
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Department"
          value={formData.department}
          onChange={(e) =>
            setFormData({ ...formData, department: e.target.value })
          }
          fullWidth
          required
          margin="normal"
        />
       <FormControl fullWidth margin="normal">
  <InputLabel>Module</InputLabel>
  <Select
    value={formData.module}
    onChange={(e) => {
      const selectedTitle = e.target.value;
      const selectedEvent = events.find(ev => ev.title === selectedTitle);
      setFormData({
        ...formData,
        module: selectedTitle,
        fee: selectedEvent ? selectedEvent.finalFee : 0,
      });
    }}
  >
    {events.map(ev => (
      <MenuItem key={ev._id} value={ev.title}>
        {ev.title} — PKR {ev.finalFee}
      </MenuItem>
    ))}
  </Select>
</FormControl>
         <TextField
          label="Fee (PKR)"
          value={formData.fee}
          InputProps={{ readOnly: true }}
          fullWidth
          margin="normal"
       />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
        >
          {editingStudentId ? "Update Student" : "Register"}
        </Button>
      </Box>
      {message && (
        <Typography
          color={message.includes("successfully") ? "green" : "red"}
          sx={{ marginTop: "20px", fontWeight: "bold" }}
        >
          {message}
        </Typography>
      )}
      <Typography variant="h5" className="heading">
        Registered Students
      </Typography>
      <TableContainer component={Paper} className="table-container">
        <Table>
          <TableHead>
            <TableRow className="table-header">
              <TableCell className="table-cell">Name</TableCell>
              <TableCell className="table-cell">Email</TableCell>
              <TableCell className="table-cell">Phone</TableCell>
              <TableCell className="table-cell">University</TableCell>
              <TableCell className="table-cell">Roll Number</TableCell>
              <TableCell className="table-cell">Department</TableCell>
              <TableCell className="table-cell">Module</TableCell>
              <TableCell className="table-cell">Fees Paid</TableCell>
              <TableCell className="table-cell">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student._id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.contactNumber}</TableCell>
                <TableCell>{student.university}</TableCell>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell>{student.department}</TableCell>
                <TableCell>
                  {Array.isArray(student.module)
                    ? student.module.join(", ")
                    : student.module}
                </TableCell>
                <TableCell>{student.fee ? student.fee : 0}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => handleEdit(student)}
                    sx={{ marginRight: "5px" }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    onClick={() => handleDelete(student._id)}
                    sx={{ marginleft: "10px" }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RegistrationTeam;
