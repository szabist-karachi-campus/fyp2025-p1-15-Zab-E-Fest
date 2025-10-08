import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";

const PermissionManagement = () => {
  const [moduleHeads, setModuleHeads] = useState([]);
  const [moduleLeaders, setModuleLeaders] = useState([]);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "ModuleHead", // Default role
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users by role (Module Head / Module Leader)
  const fetchUsers = () => {
    axios
      .get("http://localhost:5000/api/moduleRole/role/ModuleHead")
      .then((response) => {
        setModuleHeads(response.data);
      })
      .catch((error) => {
        console.error("Error fetching Module Head users:", error);
      });

    axios
      .get("http://localhost:5000/api/moduleRole/role/ModuleLeader")
      .then((response) => {
        setModuleLeaders(response.data);
      })
      .catch((error) => {
        console.error("Error fetching Module Leader users:", error);
      });
  };

  useEffect(() => {
    fetchUsers(); // Fetch users when the component loads
  }, []);

  // Handle Add New User (Admin adds users)
  const handleAddNewUser = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/moduleRole/register",
        newUser
      );
      console.log(response.data); // Log the response data to the console
      setIsAddDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "ModuleHead" });
      fetchUsers(); // Refresh the user lists after adding a new user
      alert("User created successfully!");
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to create user.");
    }
  };

  // Handle Edit User
  const handleEditUser = async () => {
    try {
      // Ensure selectedUser is not null and has the required data
      if (!selectedUser || !selectedUser._id) {
        alert("No user selected or user ID is missing.");
        return;
      }

      // Prepare the updated user data to send to the backend
      const updatedUser = {
        userId: selectedUser._id, // Pass the user ID here to the backend
        name: selectedUser.name,
        email: selectedUser.email,
        password: selectedUser.password,  // Optional: only if password is provided
        role: selectedUser.role,
      };

      // Send PUT request to backend to update the user
      const response = await axios.put("http://localhost:5000/api/moduleRole/update", updatedUser);

      // If the update was successful
      if (response.status === 200) {
        setIsEditDialogOpen(false);
        fetchUsers();  // Refresh the user list after successful update
        alert("User updated successfully!");
      } else {
        alert("Failed to update user.");
      }
    } catch (error) {
      console.error("Error editing user:", error);
      alert("Failed to update user.");
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/moduleRole/delete/${id}`);
      fetchUsers(); // Refresh the user lists after deleting
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Permission Management
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setIsAddDialogOpen(true)}
      >
        Add New User
      </Button>

      {/* Module Head Table */}
      <Typography variant="h5" sx={{ mt: 4 }}>
        Module Head
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Password</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {moduleHeads.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.password}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Button
                    color="secondary"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    color="error"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Module Leader Table */}
      <Typography variant="h5" sx={{ mt: 4 }}>
        Module Leader
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Password</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {moduleLeaders.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.password}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Button
                    color="secondary"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    color="error"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add New User Dialog */}
      <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <MenuItem value="ModuleHead">Module Head</MenuItem>
              <MenuItem value="ModuleLeader">Module Leader</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddNewUser} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={selectedUser?.name || ""}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser, name: e.target.value })
            }
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={selectedUser?.email || ""}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser, email: e.target.value })
            }
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={selectedUser?.password || ""}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser, password: e.target.value })
            }
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedUser?.role || "ModuleHead"}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, role: e.target.value })
              }
            >
              <MenuItem value="ModuleHead">Module Head</MenuItem>
              <MenuItem value="ModuleLeader">Module Leader</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleEditUser} color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PermissionManagement;
