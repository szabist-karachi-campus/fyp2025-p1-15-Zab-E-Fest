import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

const ModuleManagement = () => {
  const [modules, setModules] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Fetch modules and participants on mount
  useEffect(() => {
    fetchModules();
    fetchParticipants();
  }, []);

  const fetchModules = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/events");
      const data = await res.json();
      setModules(data);
    } catch (err) {
      console.error("Error fetching modules:", err);
    }
  };

  const fetchParticipants = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/participants");
      const data = await res.json();
      setParticipants(data);
    } catch (err) {
      console.error("Error fetching participants:", err);
    }
  };

  // Filter participants for the selected module
  const participantsForSelectedModule = selectedModule
    ? participants.filter((p) => p.module === selectedModule.title)
    : [];

  // Handle participant edit submit
  const handleEditSubmit = async () => {
    try {
      await fetch(`http://localhost:5000/api/participants/${editingParticipant._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      await fetchParticipants();
      setEditingParticipant(null);
    } catch (err) {
      console.error("Error updating participant:", err);
    }
  };

  // Handle participant delete and rollback
  const handleDeleteParticipant = async (participant) => {
    try {
      await fetch(`http://localhost:5000/api/participants/${participant._id}`, {
        method: "DELETE",
      });

      // Rollback application status to Rejected
      if (participant.applicationId) {
        await fetch(`http://localhost:5000/api/applications/${participant.applicationId}/reject`, {
          method: "PUT",
        });
      }

      await fetchParticipants();
    } catch (err) {
      console.error("Error deleting participant:", err);
    }
  };

  return (
    <Box p={4} sx={{ maxWidth: "1200px", margin: "auto" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom align="center" sx={{ mb: 4 }}>
        Module Management
      </Typography>

      <Grid container spacing={4}>
        {modules.map((module) => (
          <Grid item xs={12} sm={6} md={4} key={module._id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 4 }}>
              {module.image ? (
                <CardMedia
                  component="img"
                  height="160"
                  image={module.image}
                  alt={module.title}
                  sx={{ objectFit: "cover" }}
                />
              ) : (
                <Box
                  sx={{
                    height: 160,
                    bgcolor: "grey.300",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "grey.700",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                  }}
                >
                  No Image
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>{module.title}</Typography>
                <Typography>Date: {new Date(module.date).toLocaleDateString()}</Typography>
                <Typography>Cap: {module.cap}</Typography>
                <Typography>ModuleHead: {module.moduleHead }</Typography>
                <Typography>ModuleLead: {module.moduleLeader}</Typography>
                <Typography>Final Fee: PKR {module.finalFee || 0}</Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  fullWidth
                  onClick={() => setSelectedModule(module)}
                >
                  View Participants
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Participant List Dialog */}
      {selectedModule && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
            Participants in "{selectedModule.title}"
          </Typography>
          <TableContainer component={Paper} sx={{ boxShadow: 6, borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: "primary.main" }}>
                <TableRow>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
                   <TableCell sx={{ color: "white", fontWeight: "bold" }}>Roll Number</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Contact</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Department</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>University</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Fee (PKR)</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participantsForSelectedModule.map((p) => (
                  <TableRow key={p._id} hover>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.email}</TableCell> 
                    <TableCell>{p.rollNumber}</TableCell>
                     <TableCell>{p.contactNumber}</TableCell>
                    <TableCell>{p.department}</TableCell>
                    <TableCell>{p.university}</TableCell>
                    <TableCell>{p.fee || 0}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => {
                          setEditingParticipant(p);
                          setEditFormData(p);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteParticipant(p)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box textAlign="center" mt={3}>
            <Button variant="outlined" onClick={() => setSelectedModule(null)}>
              Close
            </Button>
          </Box>
        </Box>
      )}

      {/* Edit Participant Dialog */}
      <Dialog open={!!editingParticipant} onClose={() => setEditingParticipant(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Participant</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={editFormData.name || ""}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={editFormData.email || ""}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
          />
          <TextField
            label="Roll Number"
            fullWidth
            margin="normal"
            value={editFormData.rollNumber || ""}
            onChange={(e) => setEditFormData({ ...editFormData, rollNumber: e.target.value })}
          />

          <TextField
            label="Contact Number"
            fullWidth
            margin="normal"
            value={editFormData.contactNumber || ""}
            onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
          />

          <TextField
            label="Department"
            fullWidth
            margin="normal"
            value={editFormData.department || ""}
            onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
          />
          <TextField
            label="University"
            fullWidth
            margin="normal"
            value={editFormData.university || ""}
            onChange={(e) => setEditFormData({ ...editFormData, university: e.target.value })}
          />

          <TextField
            label="Fee"
            fullWidth
            margin="normal"
            value={editFormData.fee || ""}
            onChange={(e) => setEditFormData({ ...editFormData, fee: e.target.value })}
          />

          {/* Add more fields if needed */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingParticipant(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModuleManagement;
